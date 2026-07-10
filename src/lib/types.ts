export type Role = 'client' | 'walker' | 'admin';
export type WalkStatus = 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
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
  duration_minutes: 30 | 60;
  status: WalkStatus;
  check_in_time: string | null;
  check_out_time: string | null;
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
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
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
  | 'login'
  | 'request-access'
  | 'client-dashboard'
  | 'client-walks'
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
  | 'admin-settings';
