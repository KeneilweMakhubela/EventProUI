import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { apiCall } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, recent, activity

  // Statistics state
  const [statistics, setStatistics] = useState({
    totalRegistrations: 0,
    todayRegistrations: 0,
    notificationsSent: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    totalPlayers: 0,
    checkedInToday: 0,
    registrationTrend: {},
  });

  // Recent registrations state
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      console.log('📡 Fetching dashboard statistics...');
      const response = await apiCall('/api/Dashboard/statistics', 'GET');
      console.log('📥 Statistics response:', response);
      
      if (response) {
        setStatistics({
          totalRegistrations: response.totalRegistrations || response.totalPlayers || 0,
          todayRegistrations: response.todayRegistrations || response.registeredToday || 0,
          notificationsSent: response.totalNotificationsSent || response.totalNotifications || 0,
          activeEvents: response.activeEvents || response.publishedEvents || 0,
          upcomingEvents: response.upcomingEvents || 0,
          totalPlayers: response.totalPlayers || 0,
          checkedInToday: response.checkedInToday || 0,
          registrationTrend: response.registrationTrend || {},
        });
      }
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
    }
  }, [apiCall]);

  // Fetch recent registrations
  const fetchRecentRegistrations = useCallback(async () => {
    setRecentLoading(true);
    try {
      console.log('📡 Fetching recent registrations...');
      const response = await apiCall('/api/Dashboard/recent-registrations', 'GET');
      console.log('📥 Recent registrations response:', response);
      
      if (response) {
        const items = response.items || response.data || response;
        setRecentRegistrations(Array.isArray(items) ? items.slice(0, 10) : []);
      }
    } catch (error) {
      console.error('❌ Error fetching recent registrations:', error);
    } finally {
      setRecentLoading(false);
    }
  }, [apiCall]);

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    setActivityLoading(true);
    try {
      console.log('📡 Fetching activity logs...');
      const response = await apiCall('/api/Dashboard/activity', 'GET');
      console.log('📥 Activity logs response:', response);
      
      if (response) {
        const items = response.items || response.data || response;
        setActivityLogs(Array.isArray(items) ? items.slice(0, 20) : []);
      }
    } catch (error) {
      console.error('❌ Error fetching activity logs:', error);
    } finally {
      setActivityLoading(false);
    }
  }, [apiCall]);

  // Load all data on mount
  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setLoadError('');
      
      try {
        await Promise.all([
          fetchStatistics(),
          fetchRecentRegistrations(),
          fetchActivityLogs(),
        ]);
      } catch (error) {
        setLoadError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, [fetchStatistics, fetchRecentRegistrations, fetchActivityLogs]);

  // Refresh data when tab changes
  useEffect(() => {
    if (activeTab === 'recent') {
      fetchRecentRegistrations();
    } else if (activeTab === 'activity') {
      fetchActivityLogs();
    }
  }, [activeTab, fetchRecentRegistrations, fetchActivityLogs]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-ZA', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Format datetime relative (e.g., "2 hours ago")
  const formatRelative = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  // Get activity icon
  const getActivityIcon = (type) => {
    const action = type?.toLowerCase() || '';
    if (action.includes('login')) return { icon: 'fa-sign-in-alt', color: 'text-green-500', bg: 'bg-green-100' };
    if (action.includes('logout')) return { icon: 'fa-sign-out-alt', color: 'text-orange-500', bg: 'bg-orange-100' };
    if (action.includes('register') || action.includes('create player')) return { icon: 'fa-user-plus', color: 'text-blue-500', bg: 'bg-blue-100' };
    if (action.includes('update')) return { icon: 'fa-edit', color: 'text-purple-500', bg: 'bg-purple-100' };
    if (action.includes('delete') || action.includes('deactivate')) return { icon: 'fa-trash', color: 'text-red-500', bg: 'bg-red-100' };
    if (action.includes('create event')) return { icon: 'fa-plus-circle', color: 'text-green-500', bg: 'bg-green-100' };
    if (action.includes('rsvp') || action.includes('attending')) return { icon: 'fa-check-circle', color: 'text-blue-500', bg: 'bg-blue-100' };
    if (action.includes('check-in')) return { icon: 'fa-clipboard-check', color: 'text-green-500', bg: 'bg-green-100' };
    if (action.includes('notification') || action.includes('send')) return { icon: 'fa-bell', color: 'text-purple-500', bg: 'bg-purple-100' };
    return { icon: 'fa-circle', color: 'text-gray-500', bg: 'bg-gray-100' };
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-tachometer-alt text-[#02a2e0] text-xl"></i> Dashboard Overview
      </div>

      {/* Error Message */}
      {loadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500"></i>
          <p className="text-sm text-red-700 flex-1">{loadError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-red-500 hover:text-red-700"
          >
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-gradient rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-[#02a2e0] text-xl flex-shrink-0">
            <i className="fas fa-user-friends"></i>
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold text-[#132149]">{statistics.totalRegistrations.toLocaleString()}</div>
            <div className="text-xs text-[#878da0] font-medium truncate">Total Players</div>
          </div>
        </div>

        <div className="card-gradient rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center text-green-500 text-xl flex-shrink-0">
            <i className="fas fa-user-plus"></i>
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold text-[#132149]">{statistics.todayRegistrations}</div>
            <div className="text-xs text-[#878da0] font-medium truncate">Registered Today</div>
          </div>
        </div>

        <div className="card-gradient rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-500 text-xl flex-shrink-0">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold text-[#132149]">{statistics.activeEvents}</div>
            <div className="text-xs text-[#878da0] font-medium truncate">Active Events</div>
          </div>
        </div>

        <div className="card-gradient rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="bg-orange-50 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-500 text-xl flex-shrink-0">
            <i className="fas fa-paper-plane"></i>
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold text-[#132149]">{statistics.notificationsSent.toLocaleString()}</div>
            <div className="text-xs text-[#878da0] font-medium truncate">Notifications</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: 'overview', label: 'Overview', icon: 'fa-chart-bar' },
          { value: 'recent', label: 'Recent Registrations', icon: 'fa-clock' },
          { value: 'activity', label: 'Activity Logs', icon: 'fa-history' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === tab.value
                ? 'bg-[#02a2e0] text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Registration Trend Summary */}
          <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
            <h4 className="text-[#132149] font-semibold mb-3 flex items-center gap-2">
              <i className="fas fa-chart-line text-[#02a2e0]"></i> Registration Trend
            </h4>
            {Object.keys(statistics.registrationTrend).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(statistics.registrationTrend).slice(-7).map(([date, count]) => (
                  <div key={date} className="bg-gray-50 rounded-xl p-2 text-center min-w-[50px]">
                    <div className="text-sm font-bold text-[#132149]">{count}</div>
                    <div className="text-[8px] text-gray-400">{new Date(date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#878da0] text-sm">No registration trend data available.</p>
            )}
          </div>

          {/* Recent Activity Summary */}
          <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
            <h4 className="text-[#132149] font-semibold mb-3 flex items-center gap-2">
              <i className="fas fa-clock text-[#02a2e0]"></i> Recent Activity
            </h4>
            {recentRegistrations.length > 0 ? (
              <p className="text-[#878da0] text-sm">
                <strong className="text-[#132149]">{recentRegistrations[0]?.fullName || recentRegistrations[0]?.playerName || 'Someone'}</strong> registered recently
                {recentRegistrations.length > 1 && (
                  <> · <strong className="text-[#132149]">{recentRegistrations.length}</strong> new registrations today</>
                )}
                {activityLogs.length > 0 && (
                  <> · <strong className="text-[#132149]">{activityLogs.length}</strong> system activities recorded</>
                )}
              </p>
            ) : (
              <p className="text-[#878da0] text-sm">No recent activity to display.</p>
            )}
          </div>
        </>
      )}

      {/* Recent Registrations Tab */}
      {activeTab === 'recent' && (
        <div className="card-gradient rounded-3xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[#132149] font-semibold flex items-center gap-2">
              <i className="fas fa-clock text-[#02a2e0]"></i> Recent Registrations
            </h4>
            <button 
              onClick={fetchRecentRegistrations}
              className="text-gray-400 hover:text-[#02a2e0] transition-colors"
              title="Refresh"
            >
              <i className={`fas fa-sync-alt ${recentLoading ? 'animate-spin' : ''}`}></i>
            </button>
          </div>

          {recentLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading...</p>
            </div>
          ) : recentRegistrations.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-user-clock text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-500 text-sm">No recent registrations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRegistrations.map((reg, index) => (
                <div key={reg.id || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#02a2e0] to-[#00a5df] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {getInitials(reg.fullName || reg.playerName || reg.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#132149] text-sm truncate">
                      {reg.fullName || reg.playerName || reg.name || 'Unknown Player'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{reg.email || 'No email'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-gray-500 block">
                      {formatRelative(reg.registeredDate || reg.registeredAt || reg.createdAt || reg.date)}
                    </span>
                    {reg.status && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        reg.status === 'Attending' || reg.status === 'Confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : reg.status === 'Pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {reg.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <div className="card-gradient rounded-3xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[#132149] font-semibold flex items-center gap-2">
              <i className="fas fa-history text-[#02a2e0]"></i> Activity Logs
            </h4>
            <button 
              onClick={fetchActivityLogs}
              className="text-gray-400 hover:text-[#02a2e0] transition-colors"
              title="Refresh"
            >
              <i className={`fas fa-sync-alt ${activityLoading ? 'animate-spin' : ''}`}></i>
            </button>
          </div>

          {activityLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading activity logs...</p>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-clipboard-list text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-500 text-sm">No activity logs available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activityLogs.map((log, index) => {
                const activityStyle = getActivityIcon(log.action || log.type);
                return (
                  <div key={log.id || index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className={`w-9 h-9 rounded-full ${activityStyle.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <i className={`fas ${activityStyle.icon} ${activityStyle.color} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#132149]">
                        <span className="font-semibold">{log.userName || log.user || 'System'}</span>
                        {' '}
                        <span className="text-gray-600">{log.details || log.message || log.action || 'performed an action'}</span>
                      </p>
                      {log.entityType && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                      <p>{formatDate(log.timestamp || log.createdAt || log.date)}</p>
                      <p>{formatTime(log.timestamp || log.createdAt || log.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AdminDashboard;