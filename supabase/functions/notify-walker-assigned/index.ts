import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function walkerAssignedHtml(
  walkerName: string,
  dogName: string,
  dogBreed: string | null,
  clientName: string | null,
  scheduledDate: string,
  scheduledTime: string,
  durationMinutes: number,
  behavioralNotes: string | null,
): string {
  const date = new Date(`${scheduledDate}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const time = new Date(`2000-01-01T${scheduledTime}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="display:block;font-size:20px;font-weight:700;color:#1A1A1A;margin-top:8px;">Pawsh</span>
        </td></tr>
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #E8E4DC;padding:36px 32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">New Walk Assigned</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
            Hi ${walkerName}, you've been assigned a new walk. Here are the details:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E4DC;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#F0F4E8;">
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#B8860B;width:40%;">Dog</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A1A1A;">${dogName}${dogBreed ? ` <span style="color:#6B7280;">(${dogBreed})</span>` : ""}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#374151;border-top:1px solid #E8E4DC;">Owner</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #E8E4DC;">${clientName ?? "—"}</td>
            </tr>
            <tr style="background:#F9F7F3;">
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#374151;border-top:1px solid #E8E4DC;">Date</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #E8E4DC;">${date}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#374151;border-top:1px solid #E8E4DC;">Time</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #E8E4DC;">${time} · ${durationMinutes} min</td>
            </tr>
            ${behavioralNotes ? `
            <tr style="background:#FFF8E7;">
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#92400E;border-top:1px solid #E8E4DC;">Notes</td>
              <td style="padding:12px 16px;font-size:13px;color:#92400E;border-top:1px solid #E8E4DC;">${behavioralNotes}</td>
            </tr>` : ""}
          </table>
          <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">
            Open the Pawsh app to view this walk in your schedule.
          </p>
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("FROM_EMAIL") ?? "Pawsh <onboarding@resend.dev>";

    // Verify admin caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (callerProfile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      walker_email,
      walker_name,
      dog_name,
      dog_breed,
      client_name,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      behavioral_notes,
    } = await req.json();

    if (!resendKey) {
      return new Response(JSON.stringify({ success: true, skipped: "no_resend_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [walker_email],
        subject: `New walk assigned: ${dog_name} on ${new Date(`${scheduled_date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        html: walkerAssignedHtml(
          walker_name ?? walker_email,
          dog_name,
          dog_breed ?? null,
          client_name ?? null,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          behavioral_notes ?? null,
        ),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: `Resend error: ${text}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
