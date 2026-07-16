import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import PawLogo from '../../components/ui/PawLogo';
import { useNav } from '../../contexts/NavContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { submitWalkerApplication } from '../../lib/supabase';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_BLOCKS = ['Mornings', 'Afternoons', 'Evenings'];

function toggleInArray(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export default function RequestAccessPage() {
  const { navigate } = useNav();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [role, setRole] = useState<'client' | 'walker'>('client');

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('landing')} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <PawLogo size={22} color="#B8860B" />
            <span className="font-bold text-lg text-[#1A1A1A]">Pawsh</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">I am a…</label>
            <div className="grid grid-cols-2 gap-2">
              {(['client', 'walker'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all"
                  style={role === r ? { borderColor: '#F2C94C', color: '#B8860B', backgroundColor: '#FFF5B8' } : { borderColor: '#e5e7eb', color: '#4b5563' }}
                >
                  {r === 'client' ? 'Dog Owner' : 'Dog Walker'}
                </button>
              ))}
            </div>
          </div>

          {role === 'client' ? (
            <ClientSignupForm navigate={navigate} toast={toast} signUp={signUp} />
          ) : (
            <WalkerApplicationForm navigate={navigate} toast={toast} />
          )}

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

function ClientSignupForm({ navigate, toast, signUp }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    const { error } = await signUp({ email, password, fullName, phone, role: 'client' });
    setLoading(false);
    if (error) {
      toast(error.message || 'Something went wrong. Please try again.', 'error');
      return;
    }
    toast(`Welcome to Pawsh, ${fullName.split(' ')[0]}!`, 'success');
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Create your account</h2>
      <p className="text-sm text-gray-500 mb-5">Get started in under a minute — no waiting on approval.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input
            type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="(555) 000-0000"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} required minLength={8}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all"
            />
            <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <label className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
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
          type="submit" disabled={loading}
          className="w-full py-2.5 rounded-xl text-[#1A1A1A] text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          style={{ backgroundColor: '#F2C94C' }}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </>
  );
}

function WalkerApplicationForm({ navigate, toast }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [hasTransportation, setHasTransportation] = useState<'yes' | 'no' | ''>('');
  const [neighborhood, setNeighborhood] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [consentFeatured, setConsentFeatured] = useState<'yes' | 'no' | 'prefer_not' | ''>('');
  const [daysAvailable, setDaysAvailable] = useState<string[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<string[]>([]);
  const [hoursPerWeek, setHoursPerWeek] = useState('');
  const [earliestStart, setEarliestStart] = useState('');
  const [dogExperience, setDogExperience] = useState<'professional' | 'personal' | 'both' | 'none' | ''>('');
  const [ownsDog, setOwnsDog] = useState<'yes' | 'no' | ''>('');
  const [largeBreedComfort, setLargeBreedComfort] = useState<'yes' | 'no' | 'somewhat' | ''>('');
  const [reactiveComfort, setReactiveComfort] = useState<'yes' | 'no' | 'somewhat' | ''>('');
  const [backgroundCheck, setBackgroundCheck] = useState<'yes' | 'no' | ''>('');
  const [contractorAgreement, setContractorAgreement] = useState<'yes' | 'no' | ''>('');
  const [hasSmartphone, setHasSmartphone] = useState<'yes' | 'no' | ''>('');
  const [whyInterested, setWhyInterested] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (daysAvailable.length === 0 || timeBlocks.length === 0) {
      toast('Please select at least one day and time block.', 'error');
      return;
    }
    if (earliestStart < new Date().toISOString().split('T')[0]) {
      toast('Earliest start date must be today or a future date.', 'error');
      return;
    }
    setLoading(true);
    const { error } = await submitWalkerApplication({
      full_name: fullName,
      email,
      phone,
      date_of_birth: dob,
      has_transportation: hasTransportation === 'yes',
      neighborhood,
      social_handle: socialHandle || null,
      consent_featured: consentFeatured,
      days_available: daysAvailable,
      time_blocks: timeBlocks,
      hours_per_week: hoursPerWeek,
      earliest_start_date: earliestStart,
      dog_experience: dogExperience,
      owns_dog: ownsDog === 'yes',
      large_breed_comfort: largeBreedComfort,
      reactive_dog_comfort: reactiveComfort,
      background_check_consent: backgroundCheck === 'yes',
      contractor_agreement_consent: contractorAgreement === 'yes',
      has_smartphone: hasSmartphone === 'yes',
      why_interested: whyInterested,
    });
    setLoading(false);
    if (error) {
      toast(error, 'error');
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-[#FFF5B8] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={22} style={{ color: '#B8860B' }} />
        </div>
        <h2 className="font-semibold text-[#1A1A1A] mb-1.5">Application received!</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Thanks for applying to walk for Pawsh. We'll review your application and follow up by email if it looks like a good match.
        </p>
        <button onClick={() => navigate('landing')} className="text-sm font-semibold" style={{ color: '#B8860B' }}>
          Back to home
        </button>
      </div>
    );
  }

  const radioGroup = (
    value: string, setValue: (v: any) => void, options: { value: string; label: string }[]
  ) => (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(o => (
        <button
          key={o.value} type="button" onClick={() => setValue(o.value)}
          className="py-2 rounded-lg text-xs font-medium border-2 transition-all"
          style={value === o.value ? { borderColor: '#F2C94C', color: '#B8860B', backgroundColor: '#FFF5B8' } : { borderColor: '#e5e7eb', color: '#4b5563' }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <>
      <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Walker Application</h2>
      <p className="text-sm text-gray-500 mb-5">
        Tell us a bit about yourself — we review every application and follow up if it's a good fit.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Full Name</label>
          <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Date of Birth <span className="text-gray-400 font-normal">(must be 18+)</span></label>
          <input type="date" required value={dob} onChange={e => setDob(e.target.value)} max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Do you have reliable transportation?</label>
          {radioGroup(hasTransportation, setHasTransportation, [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }])}
        </div>
        <div>
          <label className={labelClass}>Neighborhood/area in Frisco you live in <span className="text-gray-400 font-normal">(or commute time if not local)</span></label>
          <input type="text" required value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Instagram/TikTok handle <span className="text-gray-400 font-normal">(optional)</span></label>
          <input type="text" value={socialHandle} onChange={e => setSocialHandle(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Comfortable being tagged/featured in Pawsh content?</label>
          {radioGroup(consentFeatured, setConsentFeatured, [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'prefer_not', label: 'Prefer not' }])}
        </div>
        <div>
          <label className={labelClass}>Days available</label>
          <div className="grid grid-cols-2 gap-2">
            {DAYS.map(d => (
              <button
                key={d} type="button" onClick={() => setDaysAvailable(a => toggleInArray(a, d))}
                className="py-2 rounded-lg text-xs font-medium border-2 transition-all text-left px-3"
                style={daysAvailable.includes(d) ? { borderColor: '#F2C94C', color: '#B8860B', backgroundColor: '#FFF5B8' } : { borderColor: '#e5e7eb', color: '#4b5563' }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>General time blocks available</label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_BLOCKS.map(t => (
              <button
                key={t} type="button" onClick={() => setTimeBlocks(a => toggleInArray(a, t))}
                className="py-2 rounded-lg text-xs font-medium border-2 transition-all"
                style={timeBlocks.includes(t) ? { borderColor: '#F2C94C', color: '#B8860B', backgroundColor: '#FFF5B8' } : { borderColor: '#e5e7eb', color: '#4b5563' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>Hours per week you're looking for</label>
          <input type="text" required value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} placeholder="e.g. 10-15" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Earliest start date <span className="text-gray-400 font-normal">(we start late August)</span></label>
          <input type="date" required min={new Date().toISOString().split('T')[0]} value={earliestStart} onChange={e => setEarliestStart(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Do you have experience with dogs?</label>
          {radioGroup(dogExperience, setDogExperience, [{ value: 'professional', label: 'Pro' }, { value: 'personal', label: 'Personal' }, { value: 'both', label: 'Both' }, { value: 'none', label: 'None' }])}
        </div>
        <div>
          <label className={labelClass}>Do you currently own a dog?</label>
          {radioGroup(ownsDog, setOwnsDog, [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }])}
        </div>
        <div>
          <label className={labelClass}>Comfort with large or high-energy breeds</label>
          {radioGroup(largeBreedComfort, setLargeBreedComfort, [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'somewhat', label: 'Somewhat' }])}
        </div>
        <div>
          <label className={labelClass}>Comfort with reactive or anxious dogs</label>
          {radioGroup(reactiveComfort, setReactiveComfort, [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'somewhat', label: 'Somewhat' }])}
        </div>
        <div>
          <label className={labelClass}>Willing to complete a background check? <span className="text-gray-400 font-normal">(required)</span></label>
          {radioGroup(backgroundCheck, setBackgroundCheck, [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }])}
        </div>
        <div>
          <label className={labelClass}>Comfortable signing a 1099 independent contractor agreement?</label>
          {radioGroup(contractorAgreement, setContractorAgreement, [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }])}
        </div>
        <div>
          <label className={labelClass}>Smartphone with GPS/data for tracking and photo updates?</label>
          {radioGroup(hasSmartphone, setHasSmartphone, [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }])}
        </div>
        <div>
          <label className={labelClass}>Why are you interested in walking for Pawsh?</label>
          <textarea required rows={4} maxLength={1000} value={whyInterested} onChange={e => setWhyInterested(e.target.value)} className={`${inputClass} resize-none`} />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full py-2.5 rounded-xl text-[#1A1A1A] text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          style={{ backgroundColor: '#F2C94C' }}
        >
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          We review every application — you'll get an email if you're approved, with a link to set up your login.
        </p>
      </form>
    </>
  );
}
