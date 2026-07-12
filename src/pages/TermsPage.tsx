import { ChevronLeft, PawPrint } from 'lucide-react';
import { useNav } from '../contexts/NavContext';

const sections = [
  {
    title: '1. The Service',
    body: 'Pawsh connects dog owners with independent walkers for dog walking and related pet care visits, including check-ins, feeding, and medicine administration as described in your booking notes. Pawsh facilitates these bookings and payments but walkers are independent contractors, not employees of Pawsh.',
  },
  {
    title: '2. Booking & Scheduling',
    body: 'Walks may be booked up to 7 days in advance through the app. Availability is not guaranteed until a walker is assigned to your booking. We recommend booking as early as your 7-day window allows, especially for popular time slots.',
  },
  {
    title: '3. Cancellations & Refunds',
    body: 'You may cancel a scheduled walk for a full refund up to 24 hours before the scheduled time. Cancellations requested within 24 hours of a walk are not available through the app; contact us directly and we will handle it case-by-case. If a walker is unable to complete a scheduled walk, we will reassign it or issue a full refund.',
  },
  {
    title: '4. Payments',
    body: 'Payments are processed securely through Stripe at the time of booking. Pawsh does not store your full payment card details. Pricing for each service type is shown at booking and may be updated by Pawsh from time to time; changes apply only to newly scheduled walks.',
  },
  {
    title: '5. Walker Screening',
    body: 'Walker accounts are reviewed by our team. While we make reasonable efforts to screen walkers, Pawsh does not guarantee the conduct of any walker and encourages owners to communicate any special instructions clearly through the notes field on each booking.',
  },
  {
    title: '6. Your Dog & Property',
    body: 'You are responsible for providing accurate information about your dog\'s temperament, medical needs, and any risks a walker should be aware of. You are responsible for ensuring your home and yard are reasonably safe for a walker to access as needed for the visit.',
  },
  {
    title: '7. Photo & Data Use',
    body: 'Walkers may take photos of your dog during a visit as part of the walk verification report. These photos are visible to you in the app and are not shared publicly without your permission.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'Pawsh strives to connect owners with reliable, vetted walkers, but is not liable for incidents that occur during a walk beyond facilitating a resolution, refund, or reassignment as outlined in these policies.',
  },
  {
    title: '9. Changes to These Terms',
    body: 'We may update these terms from time to time. Continued use of Pawsh after changes are posted constitutes acceptance of the updated terms.',
  },
];

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">Terms & Policies</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated July 2026</p>

        <div className="space-y-8">
          {sections.map(({ title, body }) => (
            <div key={title}>
              <h2 className="font-semibold text-[#1A1A1A] mb-2">{title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Questions about these terms?{' '}
            <button onClick={() => navigate('contact')} className="font-semibold" style={{ color: '#B8860B' }}>
              Contact us
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
