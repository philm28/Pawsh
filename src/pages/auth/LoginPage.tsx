import { useState } from 'react';
import { PawPrint, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNav } from '../../contexts/NavContext';
import { useToast } from '../../contexts/ToastContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const { navigate } = useNav();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setErrorMsg(error.message || 'Invalid credentials');
      toast(error.message || 'Invalid credentials', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-forest-500 rounded-2xl mb-4 shadow-lg">
            <PawPrint size={32} className="text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Pawsh</h1>
          <p className="text-gray-500 mt-1 text-sm">Professional dog walking services</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-5">Welcome back</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-forest-500 text-white text-sm font-semibold hover:bg-forest-600 active:bg-forest-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: '#2D5016' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            {errorMsg && (
              <p className="text-red-600 text-sm text-center bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('request-access')}
            className="font-medium text-gold-400 hover:text-gold-500 transition-colors"
            style={{ color: '#C9A84C' }}
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}
