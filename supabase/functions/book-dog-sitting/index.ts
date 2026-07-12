import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import Stripe from "npm:stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RATES: Record<string, { priceCents: number; label: string }> = {
  day: { priceCents: 10000, label: "Day Sitting (4 x 15-min visits)" },
  overnight: { priceCents: 15000, label: "Overnight Sitting (3 visits + overnight stay)" },
};

const TIER_CREDIT_RATE_CENTS: Record<string, number> = {
  bundle_5: 4800,
  bundle_10: 4500,
  bundle_20: 4000,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { dog_id, visit_type, scheduled_date, client_notes, success_url, cancel_url } = await req.json();

    if (!dog_id || !visit_type || !RATES[visit_type] || !scheduled_date || !success_url || !cancel_url) {
      return new Response(JSON.stringify({ error: "Missing or invalid required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const rate = RATES[visit_type];

    // Does the client have an active bundle? That determines their credit conversion rate.
    const { data: bundle } = await admin
      .from("client_bundle_subscriptions")
      .select("tier, status")
      .eq("client_id", user.id)
      .maybeSingle();

    let creditsNeeded = 0;
    let creditRateCents = 0;
    if (bundle && bundle.status === "active") {
      creditRateCents = TIER_CREDIT_RATE_CENTS[bundle.tier];
      creditsNeeded = Math.ceil(rate.priceCents / creditRateCents);
    }

    // Pull available (unexpired, unvoided) credit lots, oldest-expiring first (FIFO)
    let creditsAvailable = 0;
    let lots: { id: string; remaining: number }[] = [];
    if (creditsNeeded > 0) {
      const { data: lotRows } = await admin
        .from("credit_lots")
        .select("id, remaining")
        .eq("client_id", user.id)
        .is("voided_at", null)
        .gt("remaining", 0)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: true });
      lots = lotRows ?? [];
      creditsAvailable = lots.reduce((sum, l) => sum + l.remaining, 0);
    }

    const creditsToUse = Math.min(creditsNeeded, creditsAvailable);
    const shortfallCredits = creditsNeeded - creditsToUse;
    // Cash covers whatever credits couldn't, converted back at the client's rate (or full price if no bundle at all)
    const cashCents = creditsNeeded > 0
      ? shortfallCredits * creditRateCents
      : rate.priceCents;

    // Deduct credits FIFO now (reserved for this booking)
    let remainingToDeduct = creditsToUse;
    for (const lot of lots) {
      if (remainingToDeduct <= 0) break;
      const take = Math.min(lot.remaining, remainingToDeduct);
      await admin.from("credit_lots").update({ remaining: lot.remaining - take }).eq("id", lot.id);
      remainingToDeduct -= take;
    }

    const { data: booking, error: bookingError } = await admin
      .from("dog_sitting_bookings")
      .insert({
        client_id: user.id,
        dog_id,
        visit_type,
        scheduled_date,
        price_cents: rate.priceCents,
        credits_used: creditsToUse,
        cash_charged_cents: cashCents,
        payment_status: cashCents > 0 ? "pending" : "paid",
        client_notes: client_notes?.trim() || null,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: bookingError?.message ?? "Failed to create booking" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (cashCents === 0) {
      // Fully covered by credits — no Stripe charge needed
      return new Response(JSON.stringify({ paid: true, booking_id: booking.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: dog } = await admin.from("dogs").select("name").eq("id", dog_id).maybeSingle();
    const stripe = new Stripe(stripeKey);

    const finalSuccessUrl = success_url.replace("BOOKING_ID_PLACEHOLDER", booking.id);
    const finalCancelUrl = cancel_url.replace("BOOKING_ID_PLACEHOLDER", booking.id);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `${rate.label}${dog ? ` for ${dog.name}` : ""}`,
            description: creditsToUse > 0
              ? `${creditsToUse} credit(s) applied — remaining balance in cash`
              : `${scheduled_date}`,
          },
          unit_amount: cashCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: { booking_type: "dog_sitting", booking_id: booking.id },
    });

    await admin.from("dog_sitting_bookings").update({ stripe_session_id: session.id }).eq("id", booking.id);

    return new Response(JSON.stringify({ url: session.url, booking_id: booking.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Dog sitting booking error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
