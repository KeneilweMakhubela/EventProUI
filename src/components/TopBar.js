import React, { useState } from 'react';

const TopBar = ({ currentRole, switchRole, activeUserLabel, toggleSidebar, onLogout, user }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get the user's actual role from the user object
  const userRole = user?.role?.toLowerCase() || 'player';

  return (
    <div className="topbar-bg text-white px-4 md:px-8 py-4 flex items-center justify-between flex-wrap gap-3 border-b border-white/10 relative z-30">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-white text-2xl focus:outline-none hover:text-[#50b4d9] transition-colors"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div className="bg-gradient-to-br from-[#02a2e0] to-[#00a5df] w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/40">
          <i className="fas fa-ticket-alt"></i>
        </div>
        <div className="font-bold text-2xl tracking-tight">
          <span className="text-[#50b4d9] font-medium">Event</span>
        </div>
        <span className="bg-[#02a2e0] text-white text-[0.65rem] font-bold px-3 py-0.5 rounded-full tracking-wider -ml-1">PRO</span>
      </div>
      
      {/* Role Buttons - Only show the user's assigned role */}
      <div className="flex bg-white/10 rounded-full p-1 backdrop-blur-md order-3 md:order-2 w-full md:w-auto justify-center">
        {userRole === 'admin' && (
          <button 
            className={`role-btn flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all duration-200 text-sm ${
              currentRole === 'admin' 
                ? 'bg-[#02a2e0] text-white shadow-lg shadow-cyan-500/40' 
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => switchRole('admin')}
          >
            <i className="fas fa-shield-alt"></i> Admin
          </button>
        )}

        {userRole === 'sponsor' && (
          <button 
            className={`role-btn flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all duration-200 text-sm ${
              currentRole === 'sponsor' 
                ? 'bg-[#02a2e0] text-white shadow-lg shadow-cyan-500/40' 
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => switchRole('sponsor')}
          >
            <i className="fas fa-star"></i> Sponsor
          </button>
        )}

        {userRole === 'player' && (
          <button 
            className={`role-btn flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all duration-200 text-sm ${
              currentRole === 'player' 
                ? 'bg-[#02a2e0] text-white shadow-lg shadow-cyan-500/40' 
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => switchRole('player')}
          >
            <i className="fas fa-user"></i> Player
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-3 order-2 md:order-3 relative">
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full text-gray-200 text-sm backdrop-blur-sm">
          <i className="fas fa-bell text-[#50b4d9]"></i>
          <span>{activeUserLabel}</span>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="focus:outline-none"
          >
            <i className="fas fa-chevron-down text-xs opacity-70 hover:opacity-100 transition-opacity"></i>
          </button>
        </div>

        {/* User Dropdown Menu */}
        {showUserMenu && (
          <>
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setShowUserMenu(false)}
            ></div>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-[#132149]">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
                <p className="text-xs text-[#02a2e0] mt-1 capitalize">
                  <i className="fas fa-shield-alt mr-1"></i> {userRole}
                </p>
              </div>
              <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <i className="fas fa-user-circle text-gray-400"></i> Profile
              </button>
              <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <i className="fas fa-cog text-gray-400"></i> Settings
              </button>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <i className="fas fa-sign-out-alt"></i> Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TopBar;