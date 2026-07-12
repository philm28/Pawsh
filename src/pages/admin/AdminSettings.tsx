import { useEffect, useState } from 'react';
import { DollarSign, Mail, Save } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [price30, setPrice30] = useState('25.00');
  const [price60, setPrice60] = useState('45.00');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('app_settings').select('key, value');
      if (data) {
        for (const row of data) {
          if (row.key === 'price_30min') setPrice30(row.value);
          if (row.key === 'price_60min') setPrice60(row.value);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const p30 = parseFloat(price30);
    const p60 = parseFloat(price60);
    if (isNaN(p30) || isNaN(p60) || p30 < 0 || p60 < 0) {
      toast('Please enter valid prices.', 'error');
      return;
    }
    setSaving(true);
    const [r1, r2] = await Promise.all([
      supabase.from('app_settings')
        .update({ value: p30.toFixed(2), updated_at: new Date().toISOString() })
        .eq('key', 'price_30min'),
      supabase.from('app_settings')
        .update({ value: p60.toFixed(2), updated_at: new Date().toISOString() })
        .eq('key', 'price_60min'),
    ]);
    setSaving(false);
    if (r1.error || r2.error) {
      toast('Failed to save settings.', 'error');
    } else {
      setPrice30(p30.toFixed(2));
      setPrice60(p60.toFixed(2));
      toast('Settings saved!', 'success');
    }
  }

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure pricing and app defaults.</p>
      </div>

      <form onSubmit={save} className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF5B8' }}>
              <DollarSign size={15} style={{ color: '#B8860B' }} />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#1A1A1A]">Walk Pricing</h2>
              <p className="text-xs text-gray-400">Applied when clients schedule walks</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '30 min walk', value: price30, onChange: setPrice30 },
              { label: '60 min walk', value: price60, onChange: setPrice60 },
            ].map(({ label, value, onChange }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              Price changes take effect for newly scheduled walks.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-2xl text-[#1A1A1A] font-semibold text-sm disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
          style={{ backgroundColor: '#F2C94C' }}
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

      {/* Email / Integrations info */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF5B8' }}>
            <Mail size={15} style={{ color: '#B8860B' }} />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-[#1A1A1A]">Email Notifications</h2>
            <p className="text-xs text-gray-400">Booking confirmations, walker assignments, reminders</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          {[
            { key: 'RESEND_API_KEY', label: 'Resend API Key', desc: 'Required for all outbound emails' },
            { key: 'FROM_EMAIL', label: 'From Address', desc: 'e.g. Pawsh <hello@yourdomain.com>' },
            { key: 'ADMIN_EMAIL', label: 'Admin Email', desc: 'Receives new access request alerts' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <code className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded-md shrink-0 mt-0.5">{key}</code>
              <div>
                <div className="text-xs font-medium text-gray-700">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 leading-relaxed">
          Set these as secrets in your Supabase project's Edge Functions settings. Emails are sent automatically but fail silently when not configured.
        </p>
      </div>
    </div>
  );
}
