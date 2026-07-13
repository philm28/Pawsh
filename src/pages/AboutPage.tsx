import { ChevronLeft, Heart, ShieldCheck, Camera } from 'lucide-react';
import { useNav } from '../contexts/NavContext';
import PawLogo from '../components/ui/PawLogo';

export default function AboutPage() {
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
              <PawLogo size={16} color="#1A1A1A" />
            </div>
            <span className="font-bold text-lg text-[#1A1A1A]">Pawsh</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-4">About Pawsh</h1>
        <p className="text-gray-500 text-lg leading-relaxed mb-12">
          Pawsh started with a simple idea: your dog deserves care from someone you actually trust,
          booked in minutes, with proof it happened.
        </p>

        <div className="space-y-10">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Why we exist</h2>
            <p className="text-gray-600 leading-relaxed">
              Dog owners shouldn't have to choose between a rigid boarding schedule and handing their
              front door code to a stranger from an app they've never heard of. Pawsh connects you with
              vetted, local walkers and keeps you in the loop the entire time — real-time check-ins,
              GPS-stamped visits, and a photo report after every walk.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: ShieldCheck, title: 'Vetted Walkers', desc: 'Every walker is reviewed by our team before they can take on regular clients.' },
              { icon: Camera, title: 'Proof of Care', desc: 'Photo reports and GPS check-ins on every visit — no guessing.' },
              { icon: Heart, title: 'Built for Dogs', desc: 'Not just walks — check-ins, feeding, and medicine too, whatever your dog needs.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-gray-50 rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: '#FFF5B8' }}>
                  <Icon size={17} style={{ color: '#B8860B' }} />
                </div>
                <h3 className="font-semibold text-sm text-[#1A1A1A] mb-1">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">How we're different</h2>
            <p className="text-gray-600 leading-relaxed">
              We're not a giant marketplace with thousands of anonymous walkers. Pawsh is built around
              a small, trusted network — the kind of walker you'd actually want to hand your house key
              to, backed by an app that makes booking, paying, and tracking visits effortless.
            </p>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">Have questions? We're happy to help.</p>
          <button
            onClick={() => navigate('contact')}
            className="text-sm font-semibold px-5 py-2.5 rounded-xl text-[#1A1A1A] transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#F2C94C' }}
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}
