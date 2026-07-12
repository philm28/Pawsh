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

    const body = await req.json();
    const {
      dog_id,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      price,
      success_url,
      cancel_url,
      walk_id: existingWalkId,
      client_notes,
    } = body;

    if (!dog_id || !scheduled_date || !scheduled_time || !duration_minutes || !price || !success_url || !cancel_url) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scheduledAt = new Date(`${scheduled_date}T${scheduled_time}`);
    const daysUntilWalk = (scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilWalk < 0 || daysUntilWalk > 7) {
      return new Response(JSON.stringify({ error: "Walks can only be booked up to 7 days in advance." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let walkId: string;

    if (existingWalkId) {
      const { data: existing } = await admin
        .from("walks")
        .select("id")
        .eq("id", existingWalkId)
        .eq("client_id", user.id)
        .eq("payment_status", "pending")
        .maybeSingle();
      if (!existing) {
        return new Response(JSON.stringify({ error: "Walk not found or already paid" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      walkId = existing.id;
    } else {
      const { data: walk, error: walkError } = await admin
        .from("walks")
        .insert({
          dog_id,
          client_id: user.id,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          price,
          status: "scheduled",
          payment_status: "pending",
          client_notes: client_notes?.trim() || null,
        })
        .select()
        .single();

      if (walkError || !walk) {
        return new Response(JSON.stringify({ error: walkError?.message ?? "Failed to create walk" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      walkId = walk.id;
    }

    const { data: dog } = await admin.from("dogs").select("name, breed").eq("id", dog_id).maybeSingle();

    const walkDate = new Date(scheduled_date + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const walkTime = new Date("2000-01-01T" + scheduled_time).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const stripe = new Stripe(stripeKey);

    const finalSuccessUrl = success_url.replace("WALK_ID_PLACEHOLDER", walkId);
    const finalCancelUrl = cancel_url.replace("WALK_ID_PLACEHOLDER", walkId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${duration_minutes}-Minute Dog Walk${dog ? ` for ${dog.name}` : ""}`,
              description: `${walkDate} at ${walkTime}${dog?.breed ? ` · ${dog.breed}` : ""}`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: { walk_id: walkId, client_id: user.id },
      customer_email: user.email ?? undefined,
    });

    await admin.from("walks").update({ stripe_session_id: session.id }).eq("id", walkId);

    return new Response(JSON.stringify({ url: session.url, walk_id: walkId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
