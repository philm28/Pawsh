import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function bookingConfirmationHtml(
  dogName: string,
  walkDate: string,
  walkTime: string,
  durationMinutes: number,
  price: number,
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="display:block;font-size:20px;font-weight:700;color:#1A1A1A;">Pawsh</span>
          <span style="display:block;font-size:13px;color:#9CA3AF;margin-top:4px;">Professional Dog Walking</span>
        </td></tr>
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #E8E4DC;padding:36px 32px;">
          <div style="width:48px;height:48px;background:#F0F4E8;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
            <span style="font-size:24px;line-height:1;">&#10003;</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">Booking Confirmed!</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
            Your walk for <strong style="color:#1A1A1A;">${dogName}</strong> has been booked and payment received.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E4DC;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#F9F7F3;">
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#374151;width:40%;">Dog</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A1A1A;">${dogName}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#374151;border-top:1px solid #E8E4DC;">Date</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #E8E4DC;">${walkDate}</td>
            </tr>
            <tr style="background:#F9F7F3;">
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#374151;border-top:1px solid #E8E4DC;">Time</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #E8E4DC;">${walkTime}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#374151;border-top:1px solid #E8E4DC;">Duration</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #E8E4DC;">${durationMinutes} minutes</td>
            </tr>
            <tr style="background:#F0F4E8;">
              <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#B8860B;border-top:1px solid #E8E4DC;">Amount Paid</td>
              <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#B8860B;border-top:1px solid #E8E4DC;">$${price.toFixed(2)}</td>
            </tr>
          </table>
          <div style="background:#F0F4E8;border-radius:12px;padding:16px 20px;">
            <p style="margin:0;font-size:13px;color:#B8860B;line-height:1.6;">
              A walker will be assigned to your booking shortly. You'll receive another notification once assigned.
            </p>
          </div>
        </td></tr>
        <tr><td style="padding-top:20px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;">Pawsh &mdash; Professional Dog Walking</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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

    const body = await req.json();
    const { session_id, walk_id, cancelled } = body;

    if (!walk_id) {
      return new Response(JSON.stringify({ error: "Missing walk_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Handle cancellation — delete the unpaid walk
    if (cancelled) {
      await admin
        .from("walks")
        .delete()
        .eq("id", walk_id)
        .eq("client_id", user.id)
        .eq("payment_status", "pending");

      return new Response(JSON.stringify({ cancelled: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify payment with Stripe
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.metadata?.walk_id !== walk_id || session.metadata?.client_id !== user.id) {
      return new Response(JSON.stringify({ error: "Session mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ paid: false, payment_status: session.payment_status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark walk as paid
    const { error: updateError } = await admin
      .from("walks")
      .update({ payment_status: "paid" })
      .eq("id", walk_id)
      .eq("client_id", user.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send booking confirmation email (best-effort)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("FROM_EMAIL") ?? "Pawsh <onboarding@resend.dev>";

    if (resendKey && user.email) {
      try {
        const { data: walkDetails } = await admin
          .from("walks")
          .select("scheduled_date, scheduled_time, duration_minutes, price, dog:dogs(name)")
          .eq("id", walk_id)
          .single();

        if (walkDetails) {
          const dogName = (walkDetails.dog as { name: string } | null)?.name ?? "Your dog";
          const walkDate = new Date(walkDetails.scheduled_date + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric",
          });
          const walkTime = new Date("2000-01-01T" + walkDetails.scheduled_time).toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit",
          });

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: fromAddress,
              to: [user.email],
              subject: `Booking Confirmed — ${dogName}'s walk on ${walkDate}`,
              html: bookingConfirmationHtml(dogName, walkDate, walkTime, walkDetails.duration_minutes, walkDetails.price),
            }),
          });
        }
      } catch { /* email is best-effort */ }
    }

    return new Response(JSON.stringify({ paid: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
