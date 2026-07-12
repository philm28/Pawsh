import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import Stripe from "npm:stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Bundle tier config — keep in sync with src/lib/bundles.ts
const TIERS: Record<string, { walksIncluded: number; monthlyPriceCents: number; label: string }> = {
  bundle_5: { walksIncluded: 5, monthlyPriceCents: 24000, label: "5 Walks / mo" },
  bundle_10: { walksIncluded: 10, monthlyPriceCents: 45000, label: "10 Walks / mo" },
  bundle_20: { walksIncluded: 20, monthlyPriceCents: 80000, label: "20 Walks / mo" },
};

function nextFirstOfMonthUnix(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return Math.floor(next.getTime() / 1000);
}

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

    const { tier, success_url, cancel_url } = await req.json();

    if (!tier || !TIERS[tier] || !success_url || !cancel_url) {
      return new Response(JSON.stringify({ error: "Missing or invalid required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const stripe = new Stripe(stripeKey);
    const tierConfig = TIERS[tier];

    // Find or create the Stripe customer for this user
    const { data: customerRow } = await admin
      .from("stripe_customers")
      .select("customer_id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    let customerId = customerRow?.customer_id;
    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = newCustomer.id;
      await admin.from("stripe_customers").insert({ user_id: user.id, customer_id: customerId });
    }

    // Check for an existing active bundle subscription — if found, this is a tier switch
    const { data: existingBundle } = await admin
      .from("client_bundle_subscriptions")
      .select("*")
      .eq("client_id", user.id)
      .maybeSingle();

    if (existingBundle?.stripe_subscription_id && ["active", "past_due"].includes(existingBundle.status)) {
      // Tier switch on the existing subscription, prorated immediately
      const subscription = await stripe.subscriptions.retrieve(existingBundle.stripe_subscription_id);
      const itemId = subscription.items.data[0].id;

      await stripe.subscriptions.update(existingBundle.stripe_subscription_id, {
        items: [{
          id: itemId,
          price_data: {
            currency: "usd",
            product_data: { name: `Pawsh Monthly Bundle — ${tierConfig.label}` },
            unit_amount: tierConfig.monthlyPriceCents,
            recurring: { interval: "month" },
          },
        }],
        proration_behavior: "create_prorations",
      });

      await admin
        .from("client_bundle_subscriptions")
        .update({ tier, updated_at: new Date().toISOString() })
        .eq("client_id", user.id);

      return new Response(JSON.stringify({ switched: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // New subscription — anchor billing to the 1st of next month, prorate the partial first period
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `Pawsh Monthly Bundle — ${tierConfig.label}` },
          unit_amount: tierConfig.monthlyPriceCents,
          recurring: { interval: "month" },
        },
        quantity: 1,
      }],
      subscription_data: {
        billing_cycle_anchor: nextFirstOfMonthUnix(),
        proration_behavior: "create_prorations",
        metadata: { client_id: user.id, tier },
      },
      success_url,
      cancel_url,
    });

    await admin.from("client_bundle_subscriptions").upsert({
      client_id: user.id,
      tier,
      status: "incomplete",
      updated_at: new Date().toISOString(),
    }, { onConflict: "client_id" });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Bundle checkout error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
