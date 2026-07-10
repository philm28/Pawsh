import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;

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

    const { walk_id } = await req.json();
    if (!walk_id) {
      return new Response(JSON.stringify({ error: "Missing walk_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: walk, error: walkErr } = await admin
      .from("walks")
      .select("id, status, payment_status, stripe_session_id, price, client_id")
      .eq("id", walk_id)
      .eq("client_id", user.id)
      .maybeSingle();

    if (walkErr || !walk) {
      return new Response(JSON.stringify({ error: "Walk not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["scheduled", "assigned"].includes(walk.status)) {
      return new Response(
        JSON.stringify({ error: `Cannot cancel a walk with status '${walk.status}'` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let refunded = false;
    let refundAmount: number | null = null;

    // Issue Stripe refund if walk was paid
    if (walk.payment_status === "paid" && walk.stripe_session_id) {
      try {
        const stripe = new Stripe(stripeKey);
        const session = await stripe.checkout.sessions.retrieve(walk.stripe_session_id);
        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as Stripe.PaymentIntent | null)?.id;

        if (paymentIntentId) {
          const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });
          refunded = refund.status === "succeeded" || refund.status === "pending";
          refundAmount = refund.amount; // in cents
        }
      } catch (stripeErr: any) {
        console.error("Stripe refund failed:", stripeErr.message);
      }
    }

    const { error: cancelErr } = await admin
      .from("walks")
      .update({ status: "cancelled" })
      .eq("id", walk_id);

    if (cancelErr) {
      return new Response(JSON.stringify({ error: cancelErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ cancelled: true, refunded, refund_amount: refundAmount != null ? refundAmount / 100 : null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
