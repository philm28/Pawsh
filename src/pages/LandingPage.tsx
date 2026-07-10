import { CheckCircle, ChevronRight, Clock, CreditCard, PawPrint, Shield, Star, Users } from 'lucide-react';
import { useNav } from '../contexts/NavContext';

export default function LandingPage() {
  const { navigate } = useNav();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2D5016' }}>
              <PawPrint size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-[#1A1A1A]">North Paws</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('login')}
              className="text-sm font-medium text-gray-600 hover:text-[#1A1A1A] transition-colors px-3 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('request-access')}
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#2D5016' }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border" style={{ backgroundColor: '#f0f4e8', color: '#2D5016', borderColor: '#d1e0b8' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              Professional Dog Walking
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] leading-tight mb-5">
              Your dog deserves{' '}
              <span style={{ color: '#2D5016' }}>the best care</span>{' '}
              on every walk
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              Book vetted, trusted walkers in minutes. Real-time updates, secure payments, and photo reports after every walk.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('request-access')}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#2D5016' }}
              >
                Request Access
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => navigate('login')}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Sign In
              </button>
            </div>
            <div className="flex items-center gap-6 mt-8 pt-8 border-t border-gray-100">
              {[
                { value: '100%', label: 'Vetted walkers' },
                { value: '5-star', label: 'Average rating' },
                { value: 'Real-time', label: 'Walk updates' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="font-bold text-[#1A1A1A]">{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#e8f0d8' }}>
              <img
                src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Happy dog"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D5016]/20 to-transparent rounded-3xl" />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-52">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#f0f4e8' }}>
                  <CheckCircle size={18} style={{ color: '#2D5016' }} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1A1A1A]">Walk Completed</div>
                  <div className="text-xs text-gray-400">Today, 2:30 PM</div>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={12} className="fill-current" style={{ color: '#C9A84C' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#FAF7F2] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">Everything you need, nothing you don't</h2>
            <p className="text-gray-500 max-w-xl mx-auto">A simple, polished experience built for busy dog owners and the walkers who care for their pets.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Trusted & Vetted Walkers',
                desc: 'Every walker on North Paws is personally reviewed and approved by our admin team before accepting bookings.',
              },
              {
                icon: Clock,
                title: 'Real-Time Walk Updates',
                desc: 'Get live check-in and check-out notifications. See when your walker arrives and when the walk ends.',
              },
              {
                icon: CreditCard,
                title: 'Secure Stripe Payments',
                desc: 'Pay safely via Stripe at the time of booking. Full refunds issued automatically if you need to cancel.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#f0f4e8' }}>
                  <Icon size={20} style={{ color: '#2D5016' }} />
                </div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">Simple from start to finish</h2>
            <p className="text-gray-500">Book a walk in under two minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Request Access', desc: 'Submit a quick request. Our team reviews and approves you within 1–2 business days.' },
              { step: '02', title: 'Book a Walk', desc: 'Pick your dog, date, time, and duration. Pay securely with your card via Stripe.' },
              { step: '03', title: 'Relax', desc: 'Your walker handles everything. Receive a photo report and check-in updates after the walk.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-5xl font-black mb-4 leading-none" style={{ color: '#f0f4e8' }}>{step}</div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Walker recruitment */}
      <section className="bg-[#2D5016] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 bg-white/10 text-white/80">
            <Users size={12} />
            For Dog Walkers
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Love dogs? Join our team.</h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8 leading-relaxed">
            Walk dogs on your schedule, build a loyal client base, and track your earnings and ratings all in one place.
          </p>
          <button
            onClick={() => navigate('request-access')}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-[#2D5016] bg-white hover:bg-gray-50 transition-colors"
          >
            Apply as a Walker
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#2D5016' }}>
              <PawPrint size={12} className="text-white" />
            </div>
            <span className="font-semibold text-sm text-[#1A1A1A]">North Paws</span>
          </div>
          <p className="text-xs text-gray-400">Professional Dog Walking</p>
          <button
            onClick={() => navigate('login')}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </footer>
    </div>
  );
}
