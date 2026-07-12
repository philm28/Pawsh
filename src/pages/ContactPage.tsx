import { ChevronLeft, Mail, MessageCircle, PawPrint, Phone } from 'lucide-react';
import { useNav } from '../contexts/NavContext';

export default function ContactPage() {
  const { navigate } = useNav();

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate('landing')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#1A1A1A] transition-colors"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <div className="flex items-center gap-2.5 ml-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F2C94C' }}>
              <PawPrint size={16} className="text-[#1A1A1A]" />
            </div>
            <span className="font-bold text-lg text-[#1A1A1A]">Pawsh</span>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-3">Questions? We're here.</h1>
        <p className="text-gray-500 text-lg leading-relaxed mb-10">
          Whether it's about a booking, your account, or becoming a walker — reach out any time.
        </p>

        <div className="space-y-4">
          <a
            href="mailto:hello@pawshapp.com"
            className="flex items-center gap-4 bg-gray-50 hover:bg-[#FFF5B8] rounded-2xl p-5 transition-colors group"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF5B8' }}>
              <Mail size={18} style={{ color: '#B8860B' }} />
            </div>
            <div>
              <div className="font-semibold text-sm text-[#1A1A1A]">Email us</div>
              <div className="text-sm text-gray-500">hello@pawshapp.com</div>
            </div>
          </a>

          <a
            href="tel:+10000000000"
            className="flex items-center gap-4 bg-gray-50 hover:bg-[#FFF5B8] rounded-2xl p-5 transition-colors group"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF5B8' }}>
              <Phone size={18} style={{ color: '#B8860B' }} />
            </div>
            <div>
              <div className="font-semibold text-sm text-[#1A1A1A]">Call or text</div>
              <div className="text-sm text-gray-500">(000) 000-0000</div>
            </div>
          </a>

          <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF5B8' }}>
              <MessageCircle size={18} style={{ color: '#B8860B' }} />
            </div>
            <div>
              <div className="font-semibold text-sm text-[#1A1A1A]">Already booked?</div>
              <div className="text-sm text-gray-500">Sign in and use the notes on any walk to reach your walker directly.</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-10">We typically respond within one business day.</p>
      </div>
    </div>
  );
}
