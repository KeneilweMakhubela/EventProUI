import React from 'react';

const Sidebar = ({ currentRole, currentView, onNavigate, isOpen, onClose }) => {
  const adminMenu = [
    { category: 'Main', items: [
      { view: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
      { view: 'events', icon: 'fa-calendar-alt', label: 'Events' },
      { view: 'players', icon: 'fa-users', label: 'Players' },
    ]},
    { category: 'Management', items: [
      { view: 'sponsors', icon: 'fa-star', label: 'Sponsors' },
      { view: 'notifications', icon: 'fa-bell', label: 'Notifications' },
      { view: 'payments', icon: 'fa-credit-card', label: 'Payments' },
      { view: 'reports', icon: 'fa-file-export', label: 'Reports' },
    ]}
  ];

  // ✅ UPDATED: Sponsor Menu with Allocated Players tab
  const sponsorMenu = [
    { category: 'Sponsor Dashboard', items: [
      { view: 'sponsor-dashboard', icon: 'fa-star', label: 'Dashboard' },
      { view: 'sponsor-application', icon: 'fa-paper-plane', label: 'Sponsor Now' },
      { view: 'sponsor-profile', icon: 'fa-building', label: 'Profile' },
      { view: 'sponsor-packages', icon: 'fa-gift', label: 'Available Packages' },
      { view: 'sponsor-allocations', icon: 'fa-check-circle', label: 'Allocated Packages' },
      { view: 'sponsor-allocated-players', icon: 'fa-user-plus', label: 'Allocated Players' }, // ✅ NEW
      { view: 'sponsor-rsvps', icon: 'fa-calendar-check', label: 'My RSVPs' },
    ]}
  ];

  const playerMenu = [
    { category: 'Menu', items: [
      { view: 'discover', icon: 'fa-compass', label: 'Discover' },
      { view: 'myrsvps', icon: 'fa-check-circle', label: 'My RSVPs' },
      { view: 'profile', icon: 'fa-id-card', label: 'Profile' },
      { view: 'checkin', icon: 'fa-qrcode', label: 'Check-in' },
    ]}
  ];

  // ✅ Updated: Check for sponsor role
  const getMenu = () => {
    if (currentRole === 'admin') return adminMenu;
    if (currentRole === 'sponsor') return sponsorMenu;
    return playerMenu;
  };

  const menu = getMenu();

  const handleNavClick = (view) => {
    onNavigate(view);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <div className={`sidebar-bg text-white w-full md:w-[270px] p-4 md:p-6 flex flex-col gap-1 overflow-y-auto border-r border-white/10 sidebar-responsive scrollbar-hide md:relative md:translate-x-0 sidebar-mobile ${isOpen ? 'open' : ''}`}>
      {menu.map((section, idx) => (
        <React.Fragment key={idx}>
          <div className="mb-2">
            <div className="text-[0.7rem] uppercase tracking-[1.2px] text-[#878da0] px-3 py-2 font-bold">
              {section.category}
            </div>
          </div>
          {section.items.map((item) => (
            <div
              key={item.view}
              className={`nav-item flex items-center gap-3 px-4 py-3 rounded-2xl font-medium cursor-pointer transition-all duration-200 text-sm ${
                currentView === item.view 
                  ? 'nav-active text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => handleNavClick(item.view)}
            >
              <i className={`fas ${item.icon} w-5 text-base`}></i> {item.label}
            </div>
          ))}
          {idx < menu.length - 1 && <div className="mt-4" />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Sidebar;