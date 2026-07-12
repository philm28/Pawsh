import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import Stripe from "npm:stripe@17.7.0";

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

    const { end_date } = await req.json();
    if (!end_date) {
      return new Response(JSON.stringify({ error: "Missing end_date" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const endDate = new Date(end_date);
    const daysOut = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysOut <= 0 || daysOut > 30) {
      return new Response(JSON.stringify({ error: "Freeze end date must be within 30 days." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: bundle } = await admin
      .from("client_bundle_subscriptions")
      .select("*")
      .eq("client_id", user.id)
      .maybeSingle();

    if (!bundle?.stripe_subscription_id || bundle.status !== "active") {
      return new Response(JSON.stringify({ error: "No active bundle subscription to freeze." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey);
    await stripe.subscriptions.update(bundle.stripe_subscription_id, {
      pause_collection: {
        behavior: "void",
        resumes_at: Math.floor(endDate.getTime() / 1000),
      },
    });

    await admin
      .from("client_bundle_subscriptions")
      .update({ status: "paused", paused_until: endDate.toISOString(), updated_at: new Date().toISOString() })
      .eq("client_id", user.id);

    await admin.from("account_freezes").insert({
      client_id: user.id,
      end_date: endDate.toISOString(),
    });

    // Freezing forfeits all current unexpired credits
    await admin
      .from("credit_lots")
      .update({ remaining: 0, voided_at: new Date().toISOString(), voided_reason: "account_frozen" })
      .eq("client_id", user.id)
      .is("voided_at", null)
      .gt("remaining", 0);

    return new Response(JSON.stringify({ frozen_until: endDate.toISOString() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Freeze account error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
