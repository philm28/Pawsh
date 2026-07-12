import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { NavProvider, useNav } from './contexts/NavContext';
import ToastContainer from './components/ui/ToastContainer';
import Header from './components/layout/Header';
import MobileNav from './components/layout/MobileNav';
import LoadingSpinner from './components/ui/LoadingSpinner';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/auth/LoginPage';
import RequestAccessPage from './pages/auth/RequestAccessPage';
import ClientDashboard from './pages/client/ClientDashboard';
import ClientWalks from './pages/client/ClientWalks';
import ClientMembership from './pages/client/ClientMembership';
import ClientDogs from './pages/client/ClientDogs';
import ClientProfile from './pages/client/ClientProfile';
import WalkerToday from './pages/walker/WalkerToday';
import WalkerUpcoming from './pages/walker/WalkerUpcoming';
import WalkerAvailability from './pages/walker/WalkerAvailability';
import WalkerProfile from './pages/walker/WalkerProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClients from './pages/admin/AdminClients';
import AdminWalkers from './pages/admin/AdminWalkers';
import AdminRequests from './pages/admin/AdminRequests';
import AdminMemberships from './pages/admin/AdminMemberships';
import AdminSettings from './pages/admin/AdminSettings';

function AppRouter() {
  const { user, profile, loading } = useAuth();
  const { page, navigate } = useNav();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) {
      if (!['request-access', 'login', 'landing', 'about', 'contact', 'terms'].includes(page)) {
        navigate('landing');
      }
      return;
    }
    const homePages = { client: 'client-dashboard', walker: 'walker-today', admin: 'admin-dashboard' } as const;
    if (page === 'login' || page === 'request-access' || page === 'landing') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') && profile.role === 'client') {
        navigate('client-walks');
      } else if ((params.get('membership') || params.get('dogsitting')) && profile.role === 'client') {
        navigate('client-membership');
      } else {
        navigate(homePages[profile.role]);
      }
    }
  }, [user, profile, loading]);

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  if (!user || !profile) {
    if (page === 'request-access') return <RequestAccessPage />;
    if (page === 'login') return <LoginPage />;
    if (page === 'about') return <AboutPage />;
    if (page === 'contact') return <ContactPage />;
    if (page === 'terms') return <TermsPage />;
    return <LandingPage />;
  }

  const isClient = profile.role === 'client';
  const isWalker = profile.role === 'walker';
  const isAdmin = profile.role === 'admin';

  function renderPage() {
    if (page === 'about') return <AboutPage />;
    if (page === 'contact') return <ContactPage />;
    if (page === 'terms') return <TermsPage />;
    if (isClient) {
      switch (page) {
        case 'client-dashboard': return <ClientDashboard />;
        case 'client-walks': return <ClientWalks />;
        case 'client-membership': return <ClientMembership />;
        case 'client-dogs': return <ClientDogs />;
        case 'client-profile': return <ClientProfile />;
        default: return <ClientDashboard />;
      }
    }
    if (isWalker) {
      switch (page) {
        case 'walker-today': return <WalkerToday />;
        case 'walker-upcoming': return <WalkerUpcoming />;
        case 'walker-availability': return <WalkerAvailability />;
        case 'walker-profile': return <WalkerProfile />;
        default: return <WalkerToday />;
      }
    }
    if (isAdmin) {
      switch (page) {
        case 'admin-dashboard': return <AdminDashboard />;
        case 'admin-clients': return <AdminClients />;
        case 'admin-walkers': return <AdminWalkers />;
        case 'admin-requests': return <AdminRequests />;
        case 'admin-memberships': return <AdminMemberships />;
        case 'admin-settings': return <AdminSettings />;
        default: return <AdminDashboard />;
      }
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Header />
      <main className="min-h-[calc(100vh-4rem)]">
        {renderPage()}
      </main>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <NavProvider>
          <AppRouter />
          <ToastContainer />
        </NavProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
