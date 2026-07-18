import { useState } from 'react';
import { ChevronLeft, MessageCircle, Send } from 'lucide-react';
import { useNav } from '../contexts/NavContext';
import { useToast } from '../contexts/ToastContext';
import { callEdgeFunction } from '../lib/supabase';
import PawLogo from '../components/ui/PawLogo';

export default function ContactPage() {
  const { navigate } = useNav();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    try {
      const res = await callEdgeFunction('send-contact-message', { name, email, message });
      const data = await res.json();
      if (data.error) {
        toast(data.error, 'error');
      } else {
        setSent(true);
        setName('');
        setEmail('');
        setMessage('');
      }
    } catch {
      toast('Failed to send your message. Please try again.', 'error');
    }
    setSending(false);
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate('landing')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#2B2620] transition-colors"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <div className="flex items-center gap-2.5 ml-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8CB80' }}>
              <PawLogo size={16} color="#2B2620" />
            </div>
            <span className="font-bold text-lg text-[#2B2620]">Pawsh</span>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="font-serif text-4xl font-bold text-[#2B2620] mb-3">Questions? We're here.</h1>
        <p className="text-gray-500 text-lg leading-relaxed mb-10">
          Whether it's about a booking, your account, or becoming a walker — reach out any time.
        </p>

        {sent ? (
          <div className="bg-[#FBF1D9] rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#E8CB80' }}>
              <Send size={20} style={{ color: '#2B2620' }} />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#2B2620] mb-2">Message sent!</h2>
            <p className="text-sm text-gray-500">We typically respond within one business day.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 rounded-2xl p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
              <textarea
                required
                rows={5}
                maxLength={2000}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:border-forest-500 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-xl text-[#2B2620] font-semibold disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8CB80' }}
            >
              {sending ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}

        <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-5 mt-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FBF1D9' }}>
            <MessageCircle size={18} style={{ color: '#9C7A3C' }} />
          </div>
          <div>
            <div className="font-semibold text-sm text-[#2B2620]">Already booked?</div>
            <div className="text-sm text-gray-500">Sign in and use the notes on any walk to reach your walker directly.</div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-10">We typically respond within one business day.</p>
      </div>
    </div>
  );
}
