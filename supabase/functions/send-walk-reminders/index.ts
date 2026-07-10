import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function reminderHtml(clientName: string, dogName: string, scheduledDate: string, scheduledTime: string, durationMinutes: number, walkerName: string | null): string {
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
          <span style="display:block;font-size:20px;font-weight:700;color:#1A1A1A;margin-top:8px;">North Paws</span>
        </td></tr>
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #E8E4DC;padding:36px 32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">Walk Reminder</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
            Hi ${clientName}, just a friendly reminder that <strong style="color:#1A1A1A;">${dogName}</strong>'s walk is tomorrow!
          </p>
          <div style="background:#F0F4E8;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#4B5563;padding-bottom:8px;">
                  <strong style="color:#2D5016;">Date</strong><br>${date}
                </td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4B5563;padding-bottom:8px;">
                  <strong style="color:#2D5016;">Time</strong><br>${time} &middot; ${durationMinutes} min
                </td>
              </tr>
              ${walkerName ? `<tr>
                <td style="font-size:13px;color:#4B5563;">
                  <strong style="color:#2D5016;">Walker</strong><br>${walkerName}
                </td>
              </tr>` : ""}
            </table>
          </div>
          <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">
            Need to cancel? Log in to the North Paws app to manage your walks.
          </p>
        </td></tr>
        <tr><td style="padding-top:20px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;">North Paws &mdash; Professional Dog Walking</p>
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
    const fromAddress = Deno.env.get("FROM_EMAIL") ?? "North Paws <onboarding@resend.dev>";

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

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { data: walks, error: walksError } = await admin
      .from("walks")
      .select("*, dog:dogs(name, breed), client:profiles!client_id(email, full_name), walker:profiles!walker_id(full_name)")
      .eq("scheduled_date", tomorrowStr)
      .in("status", ["scheduled", "assigned"]);

    if (walksError) throw walksError;
    if (!walks || walks.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No walks tomorrow" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resendKey) {
      return new Response(JSON.stringify({ success: true, skipped: "no_resend_key", would_send: walks.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sends = walks.map((walk: any) => {
      const client = walk.client as { email: string; full_name: string | null } | null;
      if (!client?.email) return Promise.resolve();
      return fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [client.email],
          subject: `Reminder: ${walk.dog?.name}'s walk is tomorrow!`,
          html: reminderHtml(
            client.full_name ?? client.email,
            walk.dog?.name ?? "your dog",
            walk.scheduled_date,
            walk.scheduled_time,
            walk.duration_minutes,
            walk.walker?.full_name ?? null,
          ),
        }),
      });
    });

    await Promise.allSettled(sends);

    return new Response(JSON.stringify({ success: true, sent: walks.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
