import { CheckCircle, ChevronRight, Clock, CreditCard, PawPrint, Shield, Star, Users, Camera, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { useNav } from '../contexts/NavContext';
import PawLogo from '../components/ui/PawLogo';

export default function LandingPage() {
  const { navigate } = useNav();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F2C94C' }}>
              <PawLogo size={16} color="#1A1A1A" />
            </div>
            <span className="font-bold text-lg text-[#1A1A1A]">Pawsh</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#pricing" className="hover:text-[#1A1A1A] transition-colors">Pricing</a>
            <a href="#how-it-works" className="hover:text-[#1A1A1A] transition-colors">How it Works</a>
            <a href="#policies" className="hover:text-[#1A1A1A] transition-colors">Policies</a>
            <button onClick={() => navigate('about')} className="hover:text-[#1A1A1A] transition-colors">About</button>
            <button onClick={() => navigate('contact')} className="hover:text-[#1A1A1A] transition-colors">Contact</button>
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
              className="text-sm font-semibold px-4 py-2 rounded-xl text-[#1A1A1A] transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#F2C94C' }}
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border" style={{ backgroundColor: '#FFF5B8', color: '#B8860B', borderColor: '#F2DA8A' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              Professional Dog Walking
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] leading-tight mb-5">
              Your dog deserves{' '}
              <span style={{ color: '#B8860B' }}>the best care</span>{' '}
              on every walk
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              Book vetted, trusted walkers in minutes. Real-time updates, secure payments, and photo reports after every walk.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('request-access')}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[#1A1A1A] font-semibold text-base transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#F2C94C' }}
              >
                Create Free Account
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
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#FBEFA8' }}>
              <img
                src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Happy dog"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#F2C94C]/20 to-transparent rounded-3xl" />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-52">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF5B8' }}>
                  <CheckCircle size={18} style={{ color: '#B8860B' }} />
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
                desc: 'Every walker on Pawsh is reviewed by our team. Accounts are active right away, and we keep an eye on new signups.',
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
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#FFF5B8' }}>
                  <Icon size={20} style={{ color: '#B8860B' }} />
                </div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">Simple, transparent pricing</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Pay per walk, or save with a monthly bundle. Charged securely to your card — single walks only when booked, bundles on the 1st of each month.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border-2 p-7 text-center" style={{ borderColor: '#e5e5e5' }}>
              <div className="text-sm font-semibold text-gray-500 mb-2">30-Minute Walk</div>
              <div className="text-4xl font-black text-[#1A1A1A] mb-1">$35</div>
              <div className="text-xs text-gray-400 mb-5">per walk</div>
              <ul className="text-sm text-gray-500 space-y-2 text-left">
                <li className="flex items-center gap-2"><CheckCircle size={14} style={{ color: '#B8860B' }} /> Great for potty breaks & short walks</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} style={{ color: '#B8860B' }} /> Photo report after every walk</li>
              </ul>
            </div>
            <div className="rounded-2xl p-7 text-center text-[#1A1A1A] relative" style={{ backgroundColor: '#F2C94C' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#C9A84C', color: '#1A1A1A' }}>
                MOST POPULAR
              </div>
              <div className="text-sm font-semibold text-[#1A1A1A]/70 mb-2">45-Minute Walk</div>
              <div className="text-4xl font-black mb-1">$50</div>
              <div className="text-xs text-[#1A1A1A]/60 mb-5">per walk</div>
              <ul className="text-sm text-[#1A1A1A]/80 space-y-2 text-left">
                <li className="flex items-center gap-2"><CheckCircle size={14} /> Full exercise for high-energy dogs</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} /> Photo report after every walk</li>
              </ul>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Pricing may vary slightly by region and is confirmed at checkout before you pay. Monthly bundles and dog sitting rates are available after you sign in.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[#FAF7F2] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">Simple from start to finish</h2>
            <p className="text-gray-500">Create your account and book your first walk in under two minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Account', desc: 'Sign up instantly as a dog owner or a walker — no waiting on approval to get in and look around.' },
              { step: '02', title: 'Book a Walk', desc: 'Add your dog, pick a date, time, and duration. Pay securely with your card via Stripe.' },
              { step: '03', title: 'Relax', desc: 'Your walker handles everything. Receive a photo report and check-in updates after the walk.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-5xl font-black mb-4 leading-none" style={{ color: '#e5e5e5' }}>{step}</div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Policies & Procedures */}
      <section id="policies" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">Policies & procedures</h2>
            <p className="text-gray-500 max-w-xl mx-auto">The essentials, up front — so there are no surprises for owners or walkers.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Clock,
                title: 'Booking & Scheduling',
                desc: 'Book walks up to 7 days in advance through the app, so your walker has time to plan around your schedule.',
              },
              {
                icon: RefreshCw,
                title: 'Cancellations & Refunds',
                desc: 'Cancel from your dashboard up to 24 hours before a scheduled walk for a full refund. Cancellations inside that window aren\'t available in the app — just reach out to us directly.',
              },
              {
                icon: XCircle,
                title: 'Missed or No-Show Walks',
                desc: "If a walker can't make it, we'll reassign your walk or issue a full refund — whichever gets your dog taken care of fastest.",
              },
              {
                icon: Camera,
                title: 'Walk Verification',
                desc: 'Every completed walk includes a timestamped check-in/check-out, and walkers can attach a photo report so you know your dog was cared for.',
              },
              {
                icon: PawPrint,
                title: 'More Than Just Walks',
                desc: 'A "walk" booking can also cover a quick check-in, feeding, or giving medicine — just add a note when you schedule so your walker knows what to expect.',
              },
              {
                icon: ShieldCheck,
                title: 'Walker Screening',
                desc: 'Walkers apply through a short application, and our team reviews every submission before an account is created — we follow up by email either way.',
              },
              {
                icon: CreditCard,
                title: 'Payment & Payouts',
                desc: 'Owners pay per walk through Stripe at booking. Walkers are paid out on a regular schedule for completed, verified walks.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF5B8' }}>
                    <Icon size={17} style={{ color: '#B8860B' }} />
                  </div>
                  <h3 className="font-semibold text-[#1A1A1A]">{title}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Walker recruitment */}
      <section className="bg-[#F2C94C] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 bg-white/10 text-[#1A1A1A]/80">
            <Users size={12} />
            For Dog Walkers
          </div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Love dogs? Join our team.</h2>
          <p className="text-[#1A1A1A]/70 max-w-xl mx-auto mb-8 leading-relaxed">
            Walk dogs on your schedule, build a loyal client base, and track your earnings and ratings all in one place.
          </p>
          <button
            onClick={() => navigate('request-access')}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-[#F2C94C] bg-white hover:bg-gray-50 transition-colors"
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
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#F2C94C' }}>
              <PawLogo size={12} color="#1A1A1A" />
            </div>
            <span className="font-semibold text-sm text-[#1A1A1A]">Pawsh</span>
          </div>
          <p className="text-xs text-gray-400">Professional Dog Walking</p>
          <div className="flex items-center gap-5">
            <button onClick={() => navigate('about')} className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
              About
            </button>
            <button onClick={() => navigate('contact')} className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
              Contact
            </button>
            <button onClick={() => navigate('terms')} className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
              Terms & Policies
            </button>
            <button onClick={() => navigate('privacy')} className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
              Privacy
            </button>
            <button
              onClick={() => navigate('login')}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
