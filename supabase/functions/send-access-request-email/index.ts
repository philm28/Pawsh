import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function applicantHtml(fullName: string, role: string): string {
  const roleLabel = role === "walker" ? "Dog Walker" : "Dog Owner";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:28px;">🐾</span>
          <span style="display:block;font-size:20px;font-weight:700;color:#1A1A1A;margin-top:8px;">Pawsh</span>
        </td></tr>
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #E8E4DC;padding:36px 32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">Request Received!</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.6;">
            Hi ${fullName}, thanks for reaching out. We've received your access request as a <strong style="color:#B8860B;">${roleLabel}</strong>.
          </p>
          <div style="background:#F0F4E8;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#B8860B;font-weight:600;">What happens next?</p>
            <p style="margin:8px 0 0;font-size:14px;color:#4B5563;line-height:1.6;">
              Our team typically reviews requests within 1–2 business days. Once approved, you'll receive your login credentials by email.
            </p>
          </div>
          <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">
            Questions? Reply to this email and we'll be happy to help.
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

function adminHtml(fullName: string, email: string, phone: string | null, role: string): string {
  const roleLabel = role === "walker" ? "Dog Walker" : "Dog Owner";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:28px;">🐾</span>
          <span style="display:block;font-size:20px;font-weight:700;color:#1A1A1A;margin-top:8px;">Pawsh</span>
        </td></tr>
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #E8E4DC;padding:36px 32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">New Access Request</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6B7280;">Someone wants to join Pawsh as a <strong style="color:#B8860B;">${roleLabel}</strong>.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E4DC;border-radius:12px;overflow:hidden;">
            <tr style="background:#F9F7F3;">
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#374151;width:40%;">Name</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A1A1A;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#374151;border-top:1px solid #E8E4DC;">Email</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #E8E4DC;">${email}</td>
            </tr>
            <tr style="background:#F9F7F3;">
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#374151;border-top:1px solid #E8E4DC;">Phone</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #E8E4DC;">${phone ?? "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#374151;border-top:1px solid #E8E4DC;">Role</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #E8E4DC;">${roleLabel}</td>
            </tr>
          </table>
          <div style="margin-top:24px;text-align:center;">
            <a href="mailto:${email}" style="display:inline-block;padding:12px 28px;background:#B8860B;color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">Reply to Applicant</a>
          </div>
        </td></tr>
        <tr><td style="padding-top:20px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;">Pawsh Admin Notification</p>
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
    const { full_name, email, phone, requested_role } = await req.json();

    if (!full_name || !email || !requested_role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const fromAddress = Deno.env.get("FROM_EMAIL") ?? "Pawsh <onboarding@resend.dev>";

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sends: Promise<Response>[] = [];

    // Confirmation to applicant
    sends.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject: "We received your request — Pawsh",
          html: applicantHtml(full_name, requested_role),
        }),
      }),
    );

    // Notification to admin
    if (adminEmail) {
      sends.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [adminEmail],
            subject: `New access request from ${full_name} — Pawsh`,
            html: adminHtml(full_name, email, phone ?? null, requested_role),
          }),
        }),
      );
    }

    const results = await Promise.allSettled(sends);
    const failed = results.filter((r) => r.status === "rejected");

    if (failed.length === results.length) {
      return new Response(
        JSON.stringify({ error: "Failed to send emails" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
