import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function callEdgeFunction(path: string, body: object): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  return fetch(`${supabaseUrl}/functions/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
      Apikey: supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });
}

export async function submitWalkerApplication(fields: Record<string, unknown>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('access_requests').insert({
    ...fields,
    requested_role: 'walker',
    status: 'pending',
  });
  if (error) return { error: error.message };

  // Notify admin + applicant by email. Non-fatal if it fails.
  callEdgeFunction('send-access-request-email', {
    ...fields,
    requested_role: 'walker',
  }).catch(() => {});

  return { error: null };
}
