import { useState } from 'react';
import { PawPrint, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNav } from '../../contexts/NavContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

export default function RequestAccessPage() {
  const { navigate } = useNav();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'client' | 'walker'>('client');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (!agreed) {
      toast('Please agree to the Pawsh policies to continue.', 'error');
      return;
    }
    setLoading(true);
    const { error } = await signUp({ email, password, fullName, phone, role });
    setLoading(false);
    if (error) {
      toast(error.message || 'Something went wrong. Please try again.', 'error');
      return;
    }
    toast(`Welcome to Pawsh, ${fullName.split(' ')[0]}!`, 'success');
    // AuthContext/App router will redirect to the right dashboard automatically
    // once the profile finishes loading.
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('landing')} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <PawPrint size={22} className="text-[#B8860B]" style={{ color: '#B8860B' }} fill="#B8860B" />
            <span className="font-bold text-lg text-[#1A1A1A]">Pawsh</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Create your account</h2>
          <p className="text-sm text-gray-500 mb-5">Get started in under a minute — no waiting on approval.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                        ? 'border-forest-500 bg-[#FFF5B8] text-[#B8860B]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                    style={role === r ? { borderColor: '#F2C94C', color: '#B8860B', backgroundColor: '#FFF5B8' } : {}}
                  >
                    {r === 'client' ? 'Dog Owner' : 'Dog Walker'}
                  </button>
                ))}
              </div>
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#B8860B] focus:ring-forest-500/30"
                style={{ accentColor: '#F2C94C' }}
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                I agree to Pawsh's{' '}
                <button type="button" onClick={() => navigate('landing')} className="underline font-medium" style={{ color: '#B8860B' }}>
                  pricing, policies &amp; payment terms
                </button>.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-[#1A1A1A] text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: '#F2C94C' }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            {role === 'walker' && (
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Walker accounts are active immediately but reviewed by our team — you can browse the app right away, and we'll follow up if we need anything else from you.
              </p>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <button onClick={() => navigate('login')} className="font-semibold" style={{ color: '#B8860B' }}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
