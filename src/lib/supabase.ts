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
      Authorization: `Bearer ${session!.access_token}`,
      Apikey: supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });
}
