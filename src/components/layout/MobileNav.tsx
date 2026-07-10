import { type LucideIcon, PawPrint, LayoutDashboard, Calendar, Dog, User, ClipboardList, Inbox, Clock, Settings } from 'lucide-react';
import { useNav } from '../../contexts/NavContext';
import { useAuth } from '../../contexts/AuthContext';
import { Page } from '../../lib/types';

interface NavItem {
  page: Page;
  label: string;
  icon: LucideIcon;
}

const clientNav: NavItem[] = [
  { page: 'client-dashboard', label: 'Home', icon: LayoutDashboard },
  { page: 'client-walks', label: 'Walks', icon: PawPrint },
  { page: 'client-dogs', label: 'Dogs', icon: Dog },
  { page: 'client-profile', label: 'Profile', icon: User },
];

const walkerNav: NavItem[] = [
  { page: 'walker-today', label: 'Today', icon: LayoutDashboard },
  { page: 'walker-upcoming', label: 'Upcoming', icon: Calendar },
  { page: 'walker-availability', label: 'Hours', icon: Clock },
  { page: 'walker-profile', label: 'Profile', icon: User },
];

const adminNav: NavItem[] = [
  { page: 'admin-dashboard', label: 'Walks', icon: ClipboardList },
  { page: 'admin-clients', label: 'Clients', icon: User },
  { page: 'admin-walkers', label: 'Walkers', icon: PawPrint },
  { page: 'admin-requests', label: 'Requests', icon: Inbox },
  { page: 'admin-settings', label: 'Settings', icon: Settings },
];

export default function MobileNav() {
  const { page, navigate } = useNav();
  const { profile } = useAuth();

  const items =
    profile?.role === 'client' ? clientNav :
    profile?.role === 'walker' ? walkerNav :
    adminNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-inset-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {items.map(item => {
          const active = page === item.page;
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => navigate(item.page)}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 transition-colors min-w-0 flex-1 ${
                active ? 'text-forest-500' : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
              <span className="text-[9px] font-medium truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
