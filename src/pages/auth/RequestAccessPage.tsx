import { useState } from 'react';
import { PawPrint, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNav } from '../../contexts/NavContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

export default function RequestAccessPage() {
  const { navigate } = useNav();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'client' | 'walker'>('client');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('access_requests').insert({
      full_name: fullName,
      email,
      phone: phone || null,
      requested_role: role,
    });
    setLoading(false);
    if (error) {
      toast('Something went wrong. Please try again.', 'error');
      return;
    }

    // Fire-and-forget email notifications — don't block on delivery
    fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-access-request-email`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone: phone || null,
          requested_role: role,
        }),
      },
    ).catch(() => {/* email failure is non-fatal */});

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Request Submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">
            We've received your request. Our team will review it and reach out to you at <strong>{email}</strong>.
          </p>
          <button
            onClick={() => navigate('login')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: '#2D5016' }}
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('login')} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <PawPrint size={22} className="text-forest-500" style={{ color: '#2D5016' }} fill="#2D5016" />
            <span className="font-bold text-lg text-[#1A1A1A]">Pawsh</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Request Access</h2>
          <p className="text-sm text-gray-500 mb-5">Fill in your details and our team will get back to you.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">I am a…</label>
              <div className="grid grid-cols-2 gap-2">
                {(['client', 'walker'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                      role === r
                        ? 'border-forest-500 bg-forest-50 text-forest-500'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                    style={role === r ? { borderColor: '#2D5016', color: '#2D5016', backgroundColor: '#f0f4e8' } : {}}
                  >
                    {r === 'client' ? 'Dog Owner' : 'Dog Walker'}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: '#2D5016' }}
            >
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
