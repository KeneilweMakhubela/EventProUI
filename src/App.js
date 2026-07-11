import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminEvents from './components/admin/AdminEvents';
import AdminPlayers from './components/admin/AdminPlayers';
import Sponsors from './components/admin/Sponsors';
import Notifications from './components/admin/Notifications';
import Payments from './components/admin/Payments';
import Reports from './components/admin/Reports';
import Discover from './components/player/Discover';
import MyRsvps from './components/player/MyRsvps';
import Profile from './components/player/Profile';
import Checkin from './components/player/Checkin';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import SponsorApplication from './components/sponsor/SponsorApplication';

import SponsorDashboard from './components/sponsor/SponsorDashboard';
import SponsorProfile from './components/sponsor/SponsorProfile';
import SponsorPackages from './components/sponsor/SponsorPackages';
import SponsorAllocations from './components/sponsor/SponsorAllocations';
import SponsorRSVPs from './components/sponsor/SponsorRSVPs';

import { initialEvents, initialPlayers, initialSponsors, initialRsvps } from './data/initialData';

function AppContent() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [currentRole, setCurrentRole] = useState('admin');
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState(initialEvents);
  const [players, setPlayers] = useState(initialPlayers);
  const [sponsors, setSponsors] = useState(initialSponsors);
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [activeUserLabel, setActiveUserLabel] = useState('admin@Event.com');
  const [authPage, setAuthPage] = useState('login'); // 'login' or 'register'

  useEffect(() => {
    if (user) {
      setCurrentRole(user.role);
      setActiveUserLabel(user.email);
      setCurrentView(user.role === 'admin' ? 'dashboard' : 'discover');
    }
  }, [user]);

  const switchRole = useCallback((role) => {
    setCurrentRole(role);
    setActiveUserLabel(role === 'admin' ? 'admin@Event.com' : user?.email || 'sarah@example.com');
    setCurrentView(role === 'admin' ? 'dashboard' : 'discover');
  }, [user]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
    if (window.innerWidth < 768) {
      closeSidebar();
    }
  };

  const handleLogout = () => {
    logout();
    setAuthPage('login');
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        closeSidebar();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(155deg, #e9edf0 0%, #dce3e8 40%, #f0f4f8 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    return authPage === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthPage('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthPage('login')} />
    );
  }

  const renderContent = () => {
  // Admin Views
  if (currentRole === 'admin') {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard players={players} events={events} />;
      case 'events':
        return <AdminEvents events={events} setEvents={setEvents} />;
      case 'players':
        return <AdminPlayers players={players} setPlayers={setPlayers} />;
      case 'sponsors':
        return <Sponsors sponsors={sponsors} setSponsors={setSponsors} />;
      case 'notifications':
        return <Notifications players={players} events={events} />;
      case 'payments':
        return <Payments />;
      case 'reports':
        return <Reports />;
      default:
        return <AdminDashboard players={players} events={events} />;
    }
  }

  // Sponsor Views
  if (currentRole === 'sponsor') {
    switch (currentView) {
      case 'sponsor-dashboard':
        return <SponsorDashboard />;
      case 'sponsor-profile':
        return <SponsorProfile />;
      case 'sponsor-packages':
        return <SponsorPackages />;
      case 'sponsor-allocations':
        return <SponsorAllocations />;
      case 'sponsor-rsvps':
        return <SponsorRSVPs />;
      case 'sponsor-application': 
        return <SponsorApplication />;
      default:
        return <SponsorDashboard />;

    }
  }

  // Player/User Views
  switch (currentView) {
    case 'discover':
      return (
        <Discover
          events={events}
          rsvps={rsvps}
          setRsvps={setRsvps}
        />
      );
    case 'myrsvps':
      return (
        <MyRsvps
          rsvps={rsvps}
          setRsvps={setRsvps}
        />
      );
    case 'profile':
      return <Profile user={user} />;
    case 'checkin':
      return <Checkin />;
    default:
      return (
        <Discover
          events={events}
          rsvps={rsvps}
          setRsvps={setRsvps}
        />
      );
  }
};

  return (
    <div className="flex justify-center items-center min-h-screen p-4 md:p-6">
      <div className="w-full max-w-7xl bg-white rounded-[2.5rem] custom-shadow-xl overflow-hidden flex flex-col transition-all duration-300 h-[92vh] max-h-[960px]">
        <TopBar 
          currentRole={currentRole} 
          switchRole={switchRole} 
          activeUserLabel={activeUserLabel}
          toggleSidebar={toggleSidebar}
          onLogout={handleLogout}
          user={user}
        />
        
        <div className="flex flex-col md:flex-row flex-1 bg-[#f8fafc] overflow-hidden relative">
          {sidebarOpen && (
            <div 
              className="sidebar-overlay md:hidden active"
              onClick={closeSidebar}
            />
          )}
          
          <Sidebar 
            currentRole={currentRole} 
            currentView={currentView}
            onNavigate={handleNavigation}
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
          
          <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#fcfdfe] scrollbar-hide">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;