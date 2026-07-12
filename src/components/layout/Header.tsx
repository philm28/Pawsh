import { type LucideIcon, PawPrint, LogOut, LayoutDashboard, Calendar, Dog, User, ClipboardList, Inbox, Clock, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNav } from '../../contexts/NavContext';
import { Page } from '../../lib/types';

interface NavItem {
  page: Page;
  label: string;
  icon: LucideIcon;
}

const clientNav: NavItem[] = [
  { page: 'client-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'client-walks', label: 'Walks', icon: PawPrint },
  { page: 'client-dogs', label: 'Dogs', icon: Dog },
  { page: 'client-profile', label: 'Profile', icon: User },
];

const walkerNav: NavItem[] = [
  { page: 'walker-today', label: "Today's Walks", icon: LayoutDashboard },
  { page: 'walker-upcoming', label: 'Upcoming', icon: Calendar },
  { page: 'walker-availability', label: 'Availability', icon: Clock },
  { page: 'walker-profile', label: 'Profile', icon: User },
];

const adminNav: NavItem[] = [
  { page: 'admin-dashboard', label: 'All Walks', icon: ClipboardList },
  { page: 'admin-clients', label: 'Clients', icon: User },
  { page: 'admin-walkers', label: 'Walkers', icon: PawPrint },
  { page: 'admin-requests', label: 'Requests', icon: Inbox },
  { page: 'admin-settings', label: 'Settings', icon: Settings },
];

export default function Header() {
  const { profile, signOut } = useAuth();
  const { page, navigate } = useNav();

  const items =
    profile?.role === 'client' ? clientNav :
    profile?.role === 'walker' ? walkerNav :
    adminNav;

  const homePages: Record<string, Page> = {
    client: 'client-dashboard',
    walker: 'walker-today',
    admin: 'admin-dashboard',
  };

  return (
    <header className="hidden md:flex sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur border-b border-gray-100 h-16 items-center px-6">
      <button
        onClick={() => navigate(homePages[profile?.role ?? 'client'])}
        className="flex items-center gap-2 font-bold text-xl text-[#B8860B] mr-8 transition-opacity hover:opacity-80"
      >
        <PawPrint size={26} className="text-[#B8860B]" fill="#B8860B" />
        <span>Pawsh</span>
      </button>

      <nav className="flex items-center gap-1 flex-1">
        {items.map(item => {
          const active = page === item.page;
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => navigate(item.page)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-forest-500 text-[#1A1A1A]'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{profile?.full_name}</div>
          <div className="text-xs text-gray-500 capitalize">{profile?.role}</div>
        </div>
        <button
          onClick={signOut}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
