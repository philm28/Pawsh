import { ChevronLeft } from 'lucide-react';
import { useNav } from '../contexts/NavContext';
import PawLogo from '../components/ui/PawLogo';

const sections = [
  {
    title: '1. Information We Collect',
    body: 'When you create an account, we collect your name, email, phone number, and (for walkers) additional application details like date of birth, availability, and experience with dogs. When you book a walk, we collect information about your dog and your payment details, processed securely through Stripe — we never see or store your full card number.',
  },
  {
    title: '2. Location Data',
    body: 'With your permission, Pawsh captures a walker\'s location at the moment a walk is checked in and checked out. This is a point-in-time timestamp, not continuous tracking — we do not monitor your location outside of these two moments, and location access can be denied without preventing you from using the app.',
  },
  {
    title: '3. Photos',
    body: 'Walkers can attach a photo at the end of a walk as a visual report for the owner. Photos are stored securely and are only visible to the client who booked that walk and to Pawsh administrators.',
  },
  {
    title: '4. How We Use Your Information',
    body: 'We use your information to operate the core service: matching walkers with bookings, processing payments, sending booking and account notifications, and reviewing walker applications. We do not sell your personal information to third parties.',
  },
  {
    title: '5. Third-Party Services',
    body: 'Pawsh relies on a small number of trusted service providers to operate: Supabase for account and data storage, Stripe for payment processing, and Resend for transactional email. Each of these providers has its own privacy practices governing the data they process on our behalf.',
  },
  {
    title: '6. Data Retention',
    body: 'We retain account and walk history data for as long as your account is active. If you\'d like your account and associated data deleted, contact us and we will process the request, subject to any records we\'re required to retain for payment or legal purposes.',
  },
  {
    title: '7. Your Choices',
    body: 'You can decline location or camera permissions at any time through your device settings; core booking features will still work, though photo reports and check-in/check-out timestamps may be limited as a result. You can update or delete your account information by contacting us.',
  },
  {
    title: '8. Children',
    body: 'Pawsh is not directed at children, and we do not knowingly collect information from anyone under 18. Walkers must be 18 or older to apply.',
  },
  {
    title: '9. Changes to This Policy',
    body: 'We may update this policy from time to time. Continued use of Pawsh after changes are posted constitutes acceptance of the updated policy.',
  },
];

export default function PrivacyPolicyPage() {
  const { navigate } = useNav();

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
        <h1 className="font-serif text-4xl font-bold text-[#2B2620] mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated July 2026</p>

        <div className="space-y-8">
          {sections.map(({ title, body }) => (
            <div key={title}>
              <h2 className="font-semibold text-[#2B2620] mb-2">{title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Questions about your data?{' '}
            <button onClick={() => navigate('contact')} className="font-semibold" style={{ color: '#9C7A3C' }}>
              Contact us
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
