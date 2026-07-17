export type Role = 'client' | 'walker' | 'admin';
export type WalkStatus = 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  active: boolean;
  created_at: string;
}

export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  age: number | null;
  weight: number | null;
  photo_url: string | null;
  feeding_notes: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  behavioral_notes: string | null;
  created_at: string;
}

export interface Walk {
  id: string;
  dog_id: string;
  client_id: string;
  walker_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: 30 | 45;
  status: WalkStatus;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  walker_notes: string | null;
  client_notes: string | null;
  photo_url: string | null;
  price: number;
  payment_status: 'pending' | 'paid';
  stripe_session_id: string | null;
  created_at: string;
  // Joined fields
  dog?: Dog;
  client?: Profile;
  walker?: Profile;
}

export interface WalkRating {
  id: string;
  walk_id: string;
  client_id: string;
  walker_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface AccessRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  requested_role: 'client' | 'walker';
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  created_at: string;
  date_of_birth: string | null;
  has_transportation: boolean | null;
  neighborhood: string | null;
  social_handle: string | null;
  consent_featured: 'yes' | 'no' | 'prefer_not' | null;
  days_available: string[] | null;
  time_blocks: string[] | null;
  hours_per_week: string | null;
  earliest_start_date: string | null;
  dog_experience: 'professional' | 'personal' | 'both' | 'none' | null;
  owns_dog: boolean | null;
  large_breed_comfort: 'yes' | 'no' | 'somewhat' | null;
  reactive_dog_comfort: 'yes' | 'no' | 'somewhat' | null;
  background_check_consent: boolean | null;
  contractor_agreement_consent: boolean | null;
  has_smartphone: boolean | null;
  why_interested: string | null;
}

export interface WalkerAvailability {
  id: string;
  walker_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

export type Page =
  | 'landing'
  | 'about'
  | 'contact'
  | 'terms'
  | 'privacy'
  | 'login'
  | 'request-access'
  | 'client-dashboard'
  | 'client-walks'
  | 'client-membership'
  | 'client-dogs'
  | 'client-profile'
  | 'walker-today'
  | 'walker-upcoming'
  | 'walker-availability'
  | 'walker-profile'
  | 'admin-dashboard'
  | 'admin-clients'
  | 'admin-walkers'
  | 'admin-requests'
  | 'admin-memberships'
  | 'admin-settings';

export interface ClientBundleSubscription {
  id: string;
  client_id: string;
  tier: 'bundle_5' | 'bundle_10' | 'bundle_20';
  status: 'incomplete' | 'active' | 'past_due' | 'paused' | 'canceled';
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  paused_until: string | null;
}

export interface CreditLot {
  id: string;
  client_id: string;
  amount: number;
  remaining: number;
  granted_at: string;
  expires_at: string;
  source: 'subscription_grant' | 'admin_adjustment';
  voided_at: string | null;
}

export interface DogSittingBooking {
  id: string;
  client_id: string;
  dog_id: string;
  visit_type: 'day' | 'overnight';
  scheduled_date: string;
  price_cents: number;
  credits_used: number;
  cash_charged_cents: number;
  payment_status: 'pending' | 'paid' | 'failed';
  stripe_session_id: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  client_notes: string | null;
  created_at: string;
  dog?: Dog;
}
