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
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
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
  const { user, profile, loading, profileError, refreshProfile, signOut } = useAuth();
  const { page, navigate } = useNav();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (!['request-access', 'login', 'landing', 'about', 'contact', 'terms', 'privacy'].includes(page)) {
        navigate('landing');
      }
      return;
    }
    if (!profile) return; // still resolving or failed — handled in render below, don't redirect
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

  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <p className="font-semibold text-[#2B2620]">
            {profileError ? "We're having trouble loading your account." : 'Setting up your account…'}
          </p>
          {profileError && (
            <>
              <p className="text-sm text-gray-500">
                You're signed in, but we couldn't load your profile. This is usually temporary.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => refreshProfile()}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: '#9C7A3C' }}
                >
                  Try again
                </button>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600"
                >
                  Sign out
                </button>
              </div>
              <p className="text-xs text-gray-400">Still stuck? Contact us and we'll get it sorted.</p>
            </>
          )}
          {!profileError && <LoadingSpinner />}
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    if (page === 'request-access') return <RequestAccessPage />;
    if (page === 'login') return <LoginPage />;
    if (page === 'about') return <AboutPage />;
    if (page === 'contact') return <ContactPage />;
    if (page === 'terms') return <TermsPage />;
    if (page === 'privacy') return <PrivacyPolicyPage />;
    return <LandingPage />;
  }

  const isClient = profile.role === 'client';
  const isWalker = profile.role === 'walker';
  const isAdmin = profile.role === 'admin';

  function renderPage() {
    if (page === 'about') return <AboutPage />;
    if (page === 'contact') return <ContactPage />;
    if (page === 'terms') return <TermsPage />;
    if (page === 'privacy') return <PrivacyPolicyPage />;
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
