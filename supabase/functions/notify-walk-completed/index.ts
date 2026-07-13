import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function walkCompletedHtml(
  clientName: string,
  dogName: string,
  scheduledDate: string,
  walkerNotes: string | null,
  photoUrl: string | null,
): string {
  const date = new Date(`${scheduledDate}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="display:block;font-size:20px;font-weight:700;color:#1A1A1A;">Pawsh</span>
        </td></tr>
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #E8E4DC;padding:36px 32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">${dogName}'s walk is done!</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.6;">
            Hi ${clientName}, ${dogName} had a great walk on ${date}.
          </p>
          ${photoUrl ? `
          <img src="${photoUrl}" alt="${dogName} on their walk" style="width:100%;border-radius:12px;margin-bottom:20px;display:block;" />
          ` : ""}
          ${walkerNotes ? `
          <div style="background:#F0F4E8;border-radius:12px;padding:16px 20px;margin-bottom:8px;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#B8860B;">Notes from your walker</p>
            <p style="margin:0;font-size:14px;color:#4B5563;line-height:1.6;">${walkerNotes}</p>
          </div>
          ` : ""}
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
    const { client_email, client_name, dog_name, scheduled_date, walker_notes, photo_url } = await req.json();

    if (!client_email || !dog_name || !scheduled_date) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("FROM_EMAIL") ?? "Pawsh <onboarding@resend.dev>";

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
        to: [client_email],
        subject: `${dog_name}'s walk is complete!`,
        html: walkCompletedHtml(
          client_name ?? "there",
          dog_name,
          scheduled_date,
          walker_notes ?? null,
          photo_url ?? null,
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
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
