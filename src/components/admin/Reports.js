import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Reports = () => {
  const { apiCall } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    reportType: 'all', // all, sponsors, players, guests
    attendanceType: 'all', // all, dayVisit, dinnerOnly, dinnerAndGolf, golfOnly
    dateFrom: '',
    dateTo: '',
    status: 'all', // all, active, pending, approved, rejected
    searchTerm: '',
  });

  // Available report types
  const reportTypes = [
    { value: 'all', label: 'All Registrations', icon: 'fa-users' },
    { value: 'sponsors', label: 'All Sponsors', icon: 'fa-building' },
    { value: 'players', label: 'All Players', icon: 'fa-user' },
    { value: 'guests', label: 'All Guests', icon: 'fa-user-friends' },
  ];

  // Attendance options
  const attendanceOptions = [
    { value: 'all', label: 'All Attendance Types' },
    { value: 'Day Visit', label: 'Day Visit' },
    { value: 'Dinner Only', label: 'Dinner Only' },
    { value: 'Dinner and Golf', label: 'Dinner and Golf' },
    { value: 'Golf Only', label: 'Golf Only' },
  ];

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Suspended', label: 'Suspended' },
  ];

  useEffect(() => {
    fetchReportData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, reportData]);

  const fetchReportData = async () => {
    setIsLoading(true);
    setSaveError('');
    try {
      // Fetch all required data
      const [sponsorsRes, playersRes, guestsRes] = await Promise.all([
        apiCall('/api/Sponsor/admin/all?pageSize=1000', 'GET').catch(() => ({ items: [] })),
        apiCall('/api/Players?pageSize=1000', 'GET').catch(() => ({ items: [] })),
        // If you have a guests endpoint, add it here
        // apiCall('/api/Sponsor/guests/all', 'GET').catch(() => []),
      ]);

      // Get full sponsor details including contact persons
      let sponsorsWithContacts = [];
      if (sponsorsRes?.items) {
        for (const sponsor of sponsorsRes.items) {
          // Fetch full sponsor details including contact persons
          try {
            const fullSponsor = await apiCall(`/api/Sponsor/admin/${sponsor.sponsorId}`, 'GET');
            sponsorsWithContacts.push(fullSponsor);
          } catch (error) {
            console.error(`❌ Error fetching sponsor ${sponsor.sponsorId}:`, error);
            sponsorsWithContacts.push(sponsor);
          }
        }
      }

      // Combine all data
      const combinedData = {
        sponsors: sponsorsWithContacts,
        players: playersRes?.items || [],
        guests: guestsRes || [],
      };

      setReportData(combinedData);
      setFilteredData(combinedData);
    } catch (error) {
      console.error('❌ Error fetching report data:', error);
      setSaveError('Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = { ...reportData };

    // Filter by report type
    if (filters.reportType !== 'all') {
      switch (filters.reportType) {
        case 'sponsors':
          filtered = { ...filtered, sponsors: filterSponsors(filtered.sponsors) };
          break;
        case 'players':
          filtered = { ...filtered, players: filterPlayers(filtered.players) };
          break;
        case 'guests':
          filtered = { ...filtered, guests: filterGuests(filtered.guests) };
          break;
        default:
          break;
      }
    }

    setFilteredData(filtered);
  };

  const filterSponsors = (sponsors) => {
    let filtered = [...sponsors];
    
    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(s => s.status === filters.status);
    }
    
    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(s => new Date(s.createdDate) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(s => new Date(s.createdDate) <= new Date(filters.dateTo));
    }
    
    // Filter by search term (search in company name, email, and contact persons)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(s => {
        // Search in company details
        const inCompany = 
          s.companyName?.toLowerCase().includes(term) ||
          s.email?.toLowerCase().includes(term) ||
          s.phoneNumber?.includes(term) ||
          s.registrationNumber?.toLowerCase().includes(term) ||
          s.taxNumber?.toLowerCase().includes(term);
        
        // Search in contact persons
        const inContacts = s.contactPersons?.some(cp => 
          cp.fullName?.toLowerCase().includes(term) ||
          cp.email?.toLowerCase().includes(term) ||
          cp.phoneNumber?.includes(term) ||
          cp.jobTitle?.toLowerCase().includes(term) ||
          cp.department?.toLowerCase().includes(term)
        );
        
        return inCompany || inContacts;
      });
    }
    
    return filtered;
  };

  const filterPlayers = (players) => {
    let filtered = [...players];
    
    // Filter by attendance type
    if (filters.attendanceType !== 'all') {
      filtered = filtered.filter(p => p.attendance === filters.attendanceType);
    }
    
    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    
    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(p => new Date(p.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(p => new Date(p.createdAt) <= new Date(filters.dateTo));
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.fullName?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.phoneNumber?.includes(term) ||
        p.organisation?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  const filterGuests = (guests) => {
    let filtered = [...(guests || [])];
    
    // Filter by attendance type
    if (filters.attendanceType !== 'all') {
      filtered = filtered.filter(g => g.attendance === filters.attendanceType);
    }
    
    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(g => new Date(g.createdDate) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(g => new Date(g.createdDate) <= new Date(filters.dateTo));
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(g => 
        g.name?.toLowerCase().includes(term) ||
        g.surname?.toLowerCase().includes(term) ||
        g.idNumber?.includes(term)
      );
    }
    
    return filtered;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      reportType: 'all',
      attendanceType: 'all',
      dateFrom: '',
      dateTo: '',
      status: 'all',
      searchTerm: '',
    });
  };

  const exportCSV = () => {
    try {
      let data = [];
      let headers = [];
      let filename = 'report';

      switch (filters.reportType) {
        case 'sponsors':
          data = filteredData.sponsors || [];
          headers = [
            'Company Name', 
            'Registration Number', 
            'Tax/VAT Number',
            'Email', 
            'Phone', 
            'Website',
            'Industry',
            'Company Size',
            'Status',
            'Created Date',
            // Contact person details
            'Contact Person 1 - Full Name',
            'Contact Person 1 - Email',
            'Contact Person 1 - Phone',
            'Contact Person 1 - Job Title',
            'Contact Person 1 - Department',
            'Contact Person 1 - Primary',
            'Contact Person 2 - Full Name',
            'Contact Person 2 - Email',
            'Contact Person 2 - Phone',
            'Contact Person 2 - Job Title',
            'Contact Person 2 - Department',
            'Contact Person 2 - Primary',
          ];
          filename = 'sponsors_report';
          break;
        case 'players':
          data = filteredData.players || [];
          headers = ['Full Name', 'Email', 'Phone', 'Attendance', 'Status', 'Category', 'Organisation', 'Created Date'];
          filename = 'players_report';
          break;
        case 'guests':
          data = filteredData.guests || [];
          headers = ['Name', 'Surname', 'ID Number', 'Diet', 'Attendance', 'Created Date'];
          filename = 'guests_report';
          break;
        default:
          // All data combined
          const allData = [];
          (filteredData.sponsors || []).forEach(s => {
            // Add sponsor with contact persons
            const contactInfo = s.contactPersons?.map(cp => 
              `"${cp.fullName || ''} (${cp.email || ''}, ${cp.phoneNumber || ''}, ${cp.jobTitle || ''})"`
            ).join('; ') || '';
            
            allData.push({
              type: 'Sponsor',
              name: s.companyName,
              email: s.email,
              phone: s.phoneNumber,
              status: s.status,
              date: s.createdDate,
              contactInfo: contactInfo,
            });
          });
          (filteredData.players || []).forEach(p => {
            allData.push({
              type: 'Player',
              name: p.fullName,
              email: p.email,
              phone: p.phoneNumber,
              status: p.status,
              date: p.createdAt,
              contactInfo: '',
            });
          });
          (filteredData.guests || []).forEach(g => {
            allData.push({
              type: 'Guest',
              name: `${g.name} ${g.surname}`,
              email: '',
              phone: '',
              status: '',
              date: g.createdDate,
              contactInfo: '',
            });
          });
          data = allData;
          headers = ['Type', 'Name', 'Email', 'Phone', 'Status', 'Date', 'Contact Details'];
          filename = 'all_registrations_report';
          break;
      }

      if (!data || data.length === 0) {
        setSaveError('No data to export. Please adjust your filters.');
        setTimeout(() => setSaveError(''), 3000);
        return;
      }

      // Create CSV content
      const csvRows = [];
      csvRows.push(headers.join(','));

      data.forEach(row => {
        const values = headers.map(header => {
          let value = '';
          switch (header) {
            case 'Company Name': value = row.companyName || '';
              break;
            case 'Registration Number': value = row.registrationNumber || '';
              break;
            case 'Tax/VAT Number': value = row.taxNumber || '';
              break;
            case 'Full Name': value = row.fullName || '';
              break;
            case 'Name': value = row.name || '';
              break;
            case 'Surname': value = row.surname || '';
              break;
            case 'Email': value = row.email || '';
              break;
            case 'Phone': value = row.phoneNumber || '';
              break;
            case 'Website': value = row.website || '';
              break;
            case 'Industry': value = row.industry || '';
              break;
            case 'Company Size': value = row.companySize || '';
              break;
            case 'Status': value = row.status || '';
              break;
            case 'Attendance': value = row.attendance || '';
              break;
            case 'Category': value = row.category || '';
              break;
            case 'Organisation': value = row.organisation || '';
              break;
            case 'Diet': value = row.diet || '';
              break;
            case 'ID Number': value = row.idNumber || '';
              break;
            case 'Created Date': 
              value = row.createdDate || row.createdAt || '';
              break;
            case 'Date': value = row.date || '';
              break;
            case 'Type': value = row.type || '';
              break;
            case 'Contact Details': value = row.contactInfo || '';
              break;
            // Contact Person fields
            case 'Contact Person 1 - Full Name': 
              value = row.contactPersons?.[0]?.fullName || '';
              break;
            case 'Contact Person 1 - Email': 
              value = row.contactPersons?.[0]?.email || '';
              break;
            case 'Contact Person 1 - Phone': 
              value = row.contactPersons?.[0]?.phoneNumber || '';
              break;
            case 'Contact Person 1 - Job Title': 
              value = row.contactPersons?.[0]?.jobTitle || '';
              break;
            case 'Contact Person 1 - Department': 
              value = row.contactPersons?.[0]?.department || '';
              break;
            case 'Contact Person 1 - Primary': 
              value = row.contactPersons?.[0]?.isPrimary ? 'Yes' : 'No';
              break;
            case 'Contact Person 2 - Full Name': 
              value = row.contactPersons?.[1]?.fullName || '';
              break;
            case 'Contact Person 2 - Email': 
              value = row.contactPersons?.[1]?.email || '';
              break;
            case 'Contact Person 2 - Phone': 
              value = row.contactPersons?.[1]?.phoneNumber || '';
              break;
            case 'Contact Person 2 - Job Title': 
              value = row.contactPersons?.[1]?.jobTitle || '';
              break;
            case 'Contact Person 2 - Department': 
              value = row.contactPersons?.[1]?.department || '';
              break;
            case 'Contact Person 2 - Primary': 
              value = row.contactPersons?.[1]?.isPrimary ? 'Yes' : 'No';
              break;
            default: value = '';
          }
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSaveSuccess('Report exported successfully!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      setSaveError('Failed to export report. Please try again.');
      setTimeout(() => setSaveError(''), 3000);
    }
  };

  const getStats = () => {
    const sponsors = filteredData.sponsors || [];
    const players = filteredData.players || [];
    const guests = filteredData.guests || [];
    
    return {
      totalSponsors: sponsors.length,
      totalPlayers: players.length,
      totalGuests: guests.length,
      total: sponsors.length + players.length + guests.length,
    };
  };

  const stats = getStats();

  // Helper to render contact persons
  const renderContactPersons = (contactPersons) => {
    if (!contactPersons || contactPersons.length === 0) {
      return <span className="text-gray-400 text-sm">No contacts</span>;
    }
    
    return (
      <div className="space-y-2">
        {contactPersons.map((cp, index) => (
          <div key={index} className={`p-2 rounded-lg ${cp.isPrimary ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#132149]">{cp.fullName}</span>
              {cp.isPrimary && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Primary</span>
              )}
            </div>
            <div className="text-xs text-gray-500 space-y-0.5">
              <p><i className="fas fa-envelope mr-1 text-gray-400"></i> {cp.email || 'N/A'}</p>
              <p><i className="fas fa-phone mr-1 text-gray-400"></i> {cp.phoneNumber || 'N/A'}</p>
              {cp.jobTitle && <p><i className="fas fa-briefcase mr-1 text-gray-400"></i> {cp.jobTitle}</p>}
              {cp.department && <p><i className="fas fa-building mr-1 text-gray-400"></i> {cp.department}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-file-export text-[#02a2e0]"></i> Reports
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
          <i className="fas fa-check-circle text-green-500"></i>
          <span className="text-green-700">{saveSuccess}</span>
          <button onClick={() => setSaveSuccess('')} className="ml-auto text-green-500 hover:text-green-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      {saveError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500"></i>
          <span className="text-red-700">{saveError}</span>
          <button onClick={() => setSaveError('')} className="ml-auto text-red-500 hover:text-red-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-[#132149]">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Registrations</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{stats.totalSponsors}</div>
          <div className="text-xs text-gray-500">Sponsors</div>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">{stats.totalPlayers}</div>
          <div className="text-xs text-gray-500">Players</div>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">{stats.totalGuests}</div>
          <div className="text-xs text-gray-500">Guests</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-[#132149] mb-4">
          <i className="fas fa-filter text-[#02a2e0] mr-2"></i> Filters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Type */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Report Type</label>
            <select
              name="reportType"
              value={filters.reportType}
              onChange={handleFilterChange}
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  <i className={`fas ${type.icon} mr-2`}></i> {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Attendance Type */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Attendance Type</label>
            <select
              name="attendanceType"
              value={filters.attendanceType}
              onChange={handleFilterChange}
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
            >
              {attendanceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Date From</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Date To</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
            />
          </div>

          {/* Search */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Search</label>
            <div className="relative">
              <input
                type="text"
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                placeholder="Search by name, email, contact..."
                className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none pl-10"
              />
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={exportCSV}
            className="btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2"
          >
            <i className="fas fa-download"></i> Export CSV Report
          </button>
          <button
            onClick={clearFilters}
            className="border border-gray-300 px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
          >
            <i className="fas fa-undo mr-2"></i> Clear Filters
          </button>
          <button
            onClick={fetchReportData}
            className="border border-[#02a2e0] text-[#02a2e0] px-6 py-3 rounded-full font-semibold hover:bg-[#02a2e0] hover:text-white transition-colors"
          >
            <i className="fas fa-sync mr-2"></i> Refresh
          </button>
        </div>
      </div>

      {/* Data Preview */}
      <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-[#132149] mb-4">
          <i className="fas fa-table text-[#02a2e0] mr-2"></i> Data Preview
        </h3>

        {(() => {
          let displayData = [];
          let columns = [];

          switch (filters.reportType) {
            case 'sponsors':
              displayData = filteredData.sponsors || [];
              columns = ['Company Name', 'Email', 'Phone', 'Status', 'Contact Persons', 'Created Date'];
              break;
            case 'players':
              displayData = filteredData.players || [];
              columns = ['Full Name', 'Email', 'Phone', 'Attendance', 'Status', 'Organisation'];
              break;
            case 'guests':
              displayData = filteredData.guests || [];
              columns = ['Name', 'Surname', 'ID Number', 'Diet', 'Attendance'];
              break;
            default:
              const preview = [];
              (filteredData.sponsors || []).slice(0, 5).forEach(s => {
                const contactInfo = s.contactPersons?.map(cp => 
                  `${cp.fullName || ''} (${cp.email || ''})`
                ).join('; ') || '';
                preview.push({ 
                  type: 'Sponsor', 
                  name: s.companyName, 
                  email: s.email, 
                  status: s.status, 
                  date: s.createdDate,
                  contactInfo: contactInfo,
                });
              });
              (filteredData.players || []).slice(0, 5).forEach(p => {
                preview.push({ type: 'Player', name: p.fullName, email: p.email, status: p.status, date: p.createdAt });
              });
              displayData = preview;
              columns = ['Type', 'Name', 'Email', 'Status', 'Contact Info', 'Date'];
              break;
          }

          if (displayData.length === 0) {
            return (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <i className="fas fa-inbox text-4xl text-gray-300 mb-3"></i>
                <p className="text-gray-500">No data found matching your filters</p>
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {columns.map(col => (
                      <th key={col} className="text-left py-3 px-4 font-semibold text-gray-600">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayData.slice(0, 20).map((row, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      {columns.map(col => {
                        let value = '';
                        switch (col) {
                          case 'Company Name': value = row.companyName || '';
                            break;
                          case 'Full Name': value = row.fullName || '';
                            break;
                          case 'Name': value = row.name || '';
                            break;
                          case 'Surname': value = row.surname || '';
                            break;
                          case 'Email': value = row.email || '';
                            break;
                          case 'Phone': value = row.phoneNumber || '';
                            break;
                          case 'Status': value = row.status || '';
                            break;
                          case 'Attendance': value = row.attendance || '';
                            break;
                          case 'Organisation': value = row.organisation || '';
                            break;
                          case 'Diet': value = row.diet || '';
                            break;
                          case 'ID Number': value = row.idNumber || '';
                            break;
                          case 'Type': value = row.type || '';
                            break;
                          case 'Contact Info': value = row.contactInfo || '';
                            break;
                          case 'Contact Persons':
                            // This column renders JSX
                            return (
                              <td key={col} className="py-3 px-4 min-w-[300px]">
                                {renderContactPersons(row.contactPersons)}
                              </td>
                            );
                          case 'Date': 
                            value = row.date ? new Date(row.date).toLocaleDateString() : '';
                            break;
                          case 'Created Date': 
                            value = row.createdDate ? new Date(row.createdDate).toLocaleDateString() : '';
                            break;
                          default: value = '';
                        }
                        return (
                          <td key={col} className="py-3 px-4 text-gray-700">
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayData.length > 20 && (
                <p className="text-center text-sm text-gray-400 mt-4">
                  Showing first 20 of {displayData.length} records
                </p>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Reports;