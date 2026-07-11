import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../Modal';

const AdminPlayers = () => {
  const { apiCall } = useAuth();
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Form states
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    profileImageUrl: '',
    attendance: '',
    category: '',
    diet: '',
    handicapIndex: '',
    organisation: '',
    role: '',
    sagaAssociated: 'No',
    shirtSize: '',
    sponsor: '',
    status: 'Active',
    isActive: true,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const playersPerPage = 10;

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    
    try {
      let endpoint;
      
      if (searchQuery) {
        endpoint = `/api/Players/search?keyword=${encodeURIComponent(searchQuery)}&page=${currentPage}&pageSize=${playersPerPage}`;
      } else {
        endpoint = `/api/Players?page=${currentPage}&pageSize=${playersPerPage}`;
      }
      
      console.log('📡 Fetching players:', endpoint);
      const response = await apiCall(endpoint, 'GET');
      
      console.log('📥 Players response:', response);
      
      if (response) {
        if (Array.isArray(response)) {
          setPlayers(response);
          setTotalPages(1);
          setTotalPlayers(response.length);
        } else if (response.items) {
          setPlayers(response.items);
          setTotalPages(response.totalPages || 1);
          setTotalPlayers(response.totalCount || response.items.length);
        } else if (response.data) {
          setPlayers(response.data);
          setTotalPages(response.totalPages || 1);
          setTotalPlayers(response.total || response.data.length);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching players:', error);
      setLoadError(error.message || 'Failed to load players');
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, currentPage, searchQuery]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // View player details
  const handleViewPlayer = async (player) => {
    try {
      console.log(`📡 Fetching details for player ${player.id}`);
      const response = await apiCall(`/api/Players/${player.id}`, 'GET');
      setSelectedPlayer(response || player);
    } catch (error) {
      console.error('❌ Error fetching player details:', error);
      setSelectedPlayer(player);
    }
    setShowViewModal(true);
  };

  // Open edit form
  const handleEditPlayer = async (player) => {
    let playerData = player;
    
    // Try to get full details from API
    try {
      const response = await apiCall(`/api/Players/${player.id}`, 'GET');
      if (response) playerData = response;
    } catch (error) {
      console.log('Using basic player data for edit');
    }
    
    setSelectedPlayer(playerData);
    setEditForm({
      fullName: playerData.fullName || playerData.name || '',
      email: playerData.email || '',
      phoneNumber: playerData.phoneNumber || playerData.phone || '',
      dateOfBirth: playerData.dateOfBirth ? playerData.dateOfBirth.split('T')[0] : '',
      gender: playerData.gender || '',
      address: playerData.address || '',
      city: playerData.city || '',
      province: playerData.province || '',
      postalCode: playerData.postalCode || '',
      emergencyContactName: playerData.emergencyContactName || '',
      emergencyContactNumber: playerData.emergencyContactNumber || '',
      profileImageUrl: playerData.profileImageUrl || '',
      attendance: playerData.attendance || '',
      category: playerData.category || '',
      diet: playerData.diet || '',
      handicapIndex: playerData.handicapIndex !== undefined ? playerData.handicapIndex : '',
      organisation: playerData.organisation || '',
      role: playerData.role || '',
      sagaAssociated: playerData.sagaAssociated || 'No',
      shirtSize: playerData.shirtSize || '',
      sponsor: playerData.sponsor || '',
      status: playerData.status || 'Active',
      isActive: playerData.isActive !== undefined ? playerData.isActive : true,
    });
    setValidationErrors({});
    setSaveError('');
    setSaveSuccess('');
    setShowEditModal(true);
  };

  // Handle edit form change
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Save player (Update)
  const handleSavePlayer = async () => {
    if (!selectedPlayer?.id) {
      setSaveError('Player ID not found');
      return;
    }
    
    setIsSaving(true);
    setSaveError('');
    setValidationErrors({});
    
    // Build payload matching API exactly
    const playerData = {
      fullName: editForm.fullName?.trim() || '',
      email: editForm.email?.trim() || '',
      phoneNumber: editForm.phoneNumber?.trim() || '',
      dateOfBirth: editForm.dateOfBirth || null,
      gender: editForm.gender || '',
      address: editForm.address?.trim() || '',
      city: editForm.city?.trim() || '',
      province: editForm.province || '',
      postalCode: editForm.postalCode?.trim() || '',
      emergencyContactName: editForm.emergencyContactName?.trim() || '',
      emergencyContactNumber: editForm.emergencyContactNumber?.trim() || '',
      profileImageUrl: editForm.profileImageUrl?.trim() || '',
      isActive: editForm.isActive,
      attendance: editForm.attendance || '',
      category: editForm.category || '',
      diet: editForm.diet || '',
      handicapIndex: editForm.handicapIndex || '',
      organisation: editForm.organisation?.trim() || '',
      role: editForm.role || '',
      sagaAssociated: editForm.sagaAssociated || 'No',
      shirtSize: editForm.shirtSize || '',
      sponsor: editForm.sponsor?.trim() || '',
      status: editForm.status || 'Active',
    };

    console.log('📤 Sending to API:', JSON.stringify(playerData, null, 2));

    try {
      const response = await apiCall(`/api/Players/${selectedPlayer.id}`, 'PUT', playerData);

      if (response) {
        setSaveSuccess('Player updated successfully!');
        
        // Refresh list
        await fetchPlayers();
        
        setTimeout(() => {
          setShowEditModal(false);
          setSaveSuccess('');
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Player update failed:', error);
      
      // Display field-specific validation errors
      if (error.details) {
        setValidationErrors(error.details);
        setSaveError('Please fix the highlighted fields.');
      } else {
        setSaveError(error.message || 'Failed to update player. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Deactivate player
  const handleDeactivateClick = (player) => {
    setSelectedPlayer(player);
    setShowDeactivateModal(true);
  };

  const confirmDeactivate = async () => {
    if (!selectedPlayer?.id) return;
    
    try {
      console.log(`🗑️ Deactivating player ${selectedPlayer.id}`);
      await apiCall(`/api/Players/${selectedPlayer.id}`, 'DELETE');
      setShowDeactivateModal(false);
      setSelectedPlayer(null);
      await fetchPlayers();
      setSaveSuccess(`"${selectedPlayer.fullName || selectedPlayer.name}" has been deactivated.`);
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error deactivating player:', error);
      setSaveError(`Failed to deactivate: ${error.message}`);
      setTimeout(() => setSaveError(''), 3000);
    }
  };

  // Helper to get error message for a field
  const getFieldError = (fieldName) => {
    const errors = validationErrors[fieldName];
    if (Array.isArray(errors)) {
      return errors.join(', ');
    }
    return errors || '';
  };

  // Dropdown options
  const genderOptions = ['', 'Male', 'Female', 'Non-Binary', 'Prefer not to say'];
  const provinceOptions = [
    '', 'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 
    'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
  ];
  const shirtSizes = ['', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
  const categoryOptions = ['', 'Attendee', 'Player'];
  const attendanceOptions = [
    '', 
    'Day Guest Only', 
    'Day Guest and Dinner', 
    'Both Golf and Dinner', 
    'Playing Golf Only'
  ];
  const sagaOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' }
  ];
  const dietOptions = [
    '', 'None', 'Vegetarian', 'Vegan', 'Gluten-Free', 
    'Halal', 'Kosher', 'Dairy-Free', 'Nut-Free', 'Pescatarian', 'Other'
  ];
  const roleOptions = ['', 'player', 'sponsor', 'admin'];
  const statusOptions = ['', 'Active', 'Inactive', 'Suspended', 'Pending'];

  // Badge helpers
  const getStatusBadge = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadge = (role) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'sponsor': return 'bg-yellow-100 text-yellow-800';
      case 'player': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryBadge = (category) => {
    if (!category) return 'bg-gray-100 text-gray-800';
    switch (category) {
      case 'Player': return 'bg-blue-100 text-blue-800';
      case 'Attendee': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <>
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

      {/* Validation Errors Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
          <p className="text-sm text-yellow-700 font-medium mb-1">Please fix the following:</p>
          <ul className="text-xs text-yellow-600 list-disc pl-4">
            {Object.entries(validationErrors).map(([field, errors]) => (
              <li key={field}>
                <strong>{field}:</strong> {Array.isArray(errors) ? errors.join(', ') : errors}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-users text-[#02a2e0]"></i> Player Management
      </div>

      {/* Search and Stats Bar */}
      <div className="card-gradient rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[250px]">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:border-[#02a2e0] outline-none"
            />
          </form>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSearch}
              className="btn-primary-gradient text-white px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
            >
              <i className="fas fa-search"></i> Search
            </button>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
              >
                <i className="fas fa-times"></i> Clear
              </button>
            )}
            <button
              onClick={fetchPlayers}
              className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
            >
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-2xl p-3 text-center">
            <div className="text-xl font-bold text-[#132149]">{totalPlayers}</div>
            <div className="text-xs text-gray-500">Total Players</div>
          </div>
          <div className="bg-green-50 rounded-2xl p-3 text-center">
            <div className="text-xl font-bold text-green-700">
              {players.filter(p => p.status?.toLowerCase() === 'active' || p.isActive !== false).length}
            </div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-3 text-center">
            <div className="text-xl font-bold text-yellow-700">
              {players.filter(p => p.category === 'Player').length}
            </div>
            <div className="text-xs text-gray-500">Golf Players</div>
          </div>
          <div className="bg-purple-50 rounded-2xl p-3 text-center">
            <div className="text-xl font-bold text-purple-700">
              {players.filter(p => p.category === 'Attendee').length}
            </div>
            <div className="text-xs text-gray-500">Attendees</div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {loadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500"></i>
          <p className="text-sm text-red-700 flex-1">{loadError}</p>
          <button onClick={fetchPlayers} className="text-red-500 hover:text-red-700">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      )}

      {/* Players Table */}
      <div className="card-gradient rounded-3xl p-4 shadow-sm border border-gray-100 overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Loading players...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-user-slash text-5xl text-gray-300 mb-3"></i>
            <p className="text-gray-500">
              {searchQuery ? 'No players match your search' : 'No players found'}
            </p>
            {searchQuery && (
              <button onClick={handleClearSearch} className="text-[#02a2e0] text-sm mt-2 hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-[#132149] uppercase text-xs font-bold">
                  <th className="p-3 text-left rounded-l-xl">ID</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left hidden md:table-cell">Email</th>
                  <th className="p-3 text-left hidden lg:table-cell">Phone</th>
                  <th className="p-3 text-center">Role</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-left rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-gray-400 text-xs">#{player.id}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#02a2e0] to-[#00a5df] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(player.fullName || player.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#132149]">{player.fullName || player.name}</p>
                          <p className="text-xs text-gray-400 md:hidden">{player.email}</p>
                          {player.category && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${getCategoryBadge(player.category)}`}>
                              {player.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-gray-600 text-xs">{player.email}</td>
                    <td className="p-3 hidden lg:table-cell text-gray-600 text-xs">{player.phoneNumber || player.phone || 'N/A'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadge(player.role)}`}>
                        {player.role || 'Player'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(player.status || (player.isActive ? 'Active' : 'Inactive'))}`}>
                        {player.status || (player.isActive ? 'Active' : 'Inactive')}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleViewPlayer(player)}
                          className="bg-white border border-gray-200 p-2 rounded-full text-xs hover:bg-blue-50 hover:border-blue-200 transition-all"
                          title="View Details"
                        >
                          <i className="fas fa-eye text-blue-500"></i>
                        </button>
                        <button
                          onClick={() => handleEditPlayer(player)}
                          className="bg-white border border-gray-200 p-2 rounded-full text-xs hover:bg-green-50 hover:border-green-200 transition-all"
                          title="Edit Player"
                        >
                          <i className="fas fa-edit text-green-500"></i>
                        </button>
                        {player.status?.toLowerCase() !== 'inactive' && player.isActive !== false && (
                          <button
                            onClick={() => handleDeactivateClick(player)}
                            className="bg-white border border-red-200 p-2 rounded-full text-xs hover:bg-red-50 transition-all"
                            title="Deactivate"
                          >
                            <i className="fas fa-user-slash text-red-500"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Page {currentPage} of {totalPages} ({totalPlayers} players)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border bg-white text-sm disabled:opacity-50"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-xl border text-sm font-semibold ${
                          currentPage === pageNum
                            ? 'bg-[#02a2e0] text-white border-[#02a2e0]'
                            : 'bg-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border bg-white text-sm disabled:opacity-50"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Player Modal */}
      {showViewModal && selectedPlayer && (
        <Modal onClose={() => setShowViewModal(false)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#132149] mb-4">
              <i className="fas fa-user-circle text-[#02a2e0] mr-2"></i>
              Player Details
            </h3>

            <div className="space-y-4">
              {/* Header */}
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#02a2e0] to-[#00a5df] rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                  {(selectedPlayer.fullName || selectedPlayer.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#132149]">{selectedPlayer.fullName || selectedPlayer.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(selectedPlayer.status || (selectedPlayer.isActive ? 'Active' : 'Inactive'))}`}>
                      {selectedPlayer.status || (selectedPlayer.isActive ? 'Active' : 'Inactive')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadge(selectedPlayer.role)}`}>
                      {selectedPlayer.role || 'Player'}
                    </span>
                    {selectedPlayer.category && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getCategoryBadge(selectedPlayer.category)}`}>
                        {selectedPlayer.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div>
                <h5 className="text-sm font-semibold text-[#132149] mb-2">Personal Information</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Email</span>
                    <span className="font-semibold">{selectedPlayer.email || 'N/A'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Phone</span>
                    <span className="font-semibold">{selectedPlayer.phoneNumber || selectedPlayer.phone || 'N/A'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Date of Birth</span>
                    <span className="font-semibold">{formatDate(selectedPlayer.dateOfBirth)}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Gender</span>
                    <span className="font-semibold">{selectedPlayer.gender || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              {selectedPlayer.address && (
                <div>
                  <h5 className="text-sm font-semibold text-[#132149] mb-2">Address</h5>
                  <div className="bg-gray-50 p-3 rounded-xl text-sm">
                    <p>{selectedPlayer.address}</p>
                    <p className="text-gray-500">{selectedPlayer.city}{selectedPlayer.province ? `, ${selectedPlayer.province}` : ''} {selectedPlayer.postalCode || ''}</p>
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {(selectedPlayer.emergencyContactName || selectedPlayer.emergencyContactNumber) && (
                <div>
                  <h5 className="text-sm font-semibold text-[#132149] mb-2">Emergency Contact</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-400 block text-xs">Name</span>
                      <span className="font-semibold">{selectedPlayer.emergencyContactName || 'N/A'}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-400 block text-xs">Number</span>
                      <span className="font-semibold">{selectedPlayer.emergencyContactNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Details */}
              <div>
                <h5 className="text-sm font-semibold text-[#132149] mb-2">Event Details</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Category</span>
                    <span className="font-semibold">{selectedPlayer.category || 'N/A'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Attendance</span>
                    <span className="font-semibold">{selectedPlayer.attendance || 'N/A'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Handicap Index</span>
                    <span className="font-semibold">{selectedPlayer.handicapIndex !== undefined ? selectedPlayer.handicapIndex : 'N/A'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Shirt Size</span>
                    <span className="font-semibold">{selectedPlayer.shirtSize || 'N/A'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">SAGA Associated</span>
                    <span className="font-semibold capitalize">{selectedPlayer.sagaAssociated || 'N/A'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Diet</span>
                    <span className="font-semibold">{selectedPlayer.diet || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Organisation */}
              <div>
                <h5 className="text-sm font-semibold text-[#132149] mb-2">Organisation</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Organisation</span>
                    <span className="font-semibold">{selectedPlayer.organisation || 'N/A'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Sponsor</span>
                    <span className="font-semibold">{selectedPlayer.sponsor || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-gray-400">
                {selectedPlayer.createdAt && <p>Registered: {formatDate(selectedPlayer.createdAt)}</p>}
                {selectedPlayer.updatedAt && <p>Last Updated: {formatDate(selectedPlayer.updatedAt)}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditPlayer(selectedPlayer);
                }}
                className="flex-1 btn-primary-gradient text-white px-4 py-3 rounded-full font-semibold text-sm"
              >
                <i className="fas fa-edit mr-1"></i> Edit Player
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 border border-gray-300 px-4 py-3 rounded-full font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Player Modal */}
      {showEditModal && selectedPlayer && (
        <Modal onClose={() => setShowEditModal(false)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#132149] mb-4">
              <i className="fas fa-edit text-[#02a2e0] mr-2"></i>
              Edit Player
            </h3>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                <i className="fas fa-exclamation-circle mr-1"></i> {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700">
                <i className="fas fa-check-circle mr-1"></i> {saveSuccess}
              </div>
            )}

            {/* Validation Errors Summary */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                <p className="text-sm text-yellow-700 font-medium mb-1">Please fix the following:</p>
                <ul className="text-xs text-yellow-600 list-disc pl-4">
                  {Object.entries(validationErrors).map(([field, errors]) => (
                    <li key={field}>
                      <strong>{field}:</strong> {Array.isArray(errors) ? errors.join(', ') : errors}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text" name="fullName" value={editForm.fullName} onChange={handleEditChange}
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                />
                {getFieldError('fullName') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('fullName')}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email" name="email" value={editForm.email} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                  {getFieldError('email') && (
                    <p className="mt-1 text-xs text-red-500">{getFieldError('email')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel" name="phoneNumber" value={editForm.phoneNumber} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                  {getFieldError('phoneNumber') && (
                    <p className="mt-1 text-xs text-red-500">{getFieldError('phoneNumber')}</p>
                  )}
                </div>
              </div>

              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date" name="dateOfBirth" value={editForm.dateOfBirth} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                  {getFieldError('dateOfBirth') && (
                    <p className="mt-1 text-xs text-red-500">{getFieldError('dateOfBirth')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select name="gender" value={editForm.gender} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none">
                    {genderOptions.map(opt => <option key={opt} value={opt}>{opt || 'Select Gender'}</option>)}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text" name="address" value={editForm.address} onChange={handleEditChange}
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text" name="city" value={editForm.city} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <select name="province" value={editForm.province} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none">
                    {provinceOptions.map(opt => <option key={opt} value={opt}>{opt || 'Select Province'}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text" name="postalCode" value={editForm.postalCode} onChange={handleEditChange}
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                />
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text" name="emergencyContactName" value={editForm.emergencyContactName} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Number</label>
                  <input
                    type="tel" name="emergencyContactNumber" value={editForm.emergencyContactNumber} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select name="role" value={editForm.role} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none">
                    {roleOptions.map(opt => <option key={opt} value={opt}>{opt || 'Select Role'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={editForm.status} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none">
                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt || 'Select Status'}</option>)}
                  </select>
                </div>
              </div>

              {/* Category & Attendance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select name="category" value={editForm.category} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none">
                    {categoryOptions.map(opt => <option key={opt} value={opt}>{opt || 'Select Category'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendance</label>
                  <select name="attendance" value={editForm.attendance} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none">
                    {attendanceOptions.map(opt => <option key={opt} value={opt}>{opt || 'Select Attendance'}</option>)}
                  </select>
                </div>
              </div>

              {/* Shirt Size & Handicap Index */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shirt Size</label>
                  <select name="shirtSize" value={editForm.shirtSize} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none">
                    {shirtSizes.map(size => <option key={size} value={size}>{size || 'Select Size'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Handicap Index</label>
                  <input
                    type="number" name="handicapIndex" value={editForm.handicapIndex} onChange={handleEditChange}
                    step="0.1" min="0" max="54"
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
              </div>

              {/* SAGA & Diet */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SAGA Associated</label>
                  <select name="sagaAssociated" value={editForm.sagaAssociated} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none">
                    {sagaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diet</label>
                  <select name="diet" value={editForm.diet} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none">
                    {dietOptions.map(opt => <option key={opt} value={opt}>{opt || 'Select Diet'}</option>)}
                  </select>
                </div>
              </div>

              {/* Organisation & Sponsor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organisation</label>
                  <input
                    type="text" name="organisation" value={editForm.organisation} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor</label>
                  <input
                    type="text" name="sponsor" value={editForm.sponsor} onChange={handleEditChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
              </div>

              {/* Profile Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
                <input
                  type="url" name="profileImageUrl" value={editForm.profileImageUrl} onChange={handleEditChange}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                />
              </div>

              {/* Active Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox" name="isActive" checked={editForm.isActive} onChange={handleEditChange}
                    className="w-5 h-5 rounded-lg border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Active Account</span>
                    <p className="text-xs text-gray-400">Uncheck to deactivate this player</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSavePlayer}
                disabled={isSaving}
                className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
                ) : (
                  <><i className="fas fa-save"></i> Save Changes</>
                )}
              </button>
              <button onClick={() => setShowEditModal(false)} className="border border-gray-300 px-6 py-3 rounded-full font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && selectedPlayer && (
        <Modal onClose={() => setShowDeactivateModal(false)}>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-user-slash text-red-500 text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-[#132149] mb-2">Deactivate Player</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to deactivate <strong>"{selectedPlayer.fullName || selectedPlayer.name}"</strong>?
            </p>
            <p className="text-xs text-gray-400 mb-6">
              This will set the player as inactive. They will no longer be able to access the system.
            </p>
            <div className="flex gap-3">
              <button onClick={confirmDeactivate} className="flex-1 bg-red-500 text-white px-6 py-3 rounded-full font-semibold">
                <i className="fas fa-user-slash mr-1"></i> Yes, Deactivate
              </button>
              <button onClick={() => setShowDeactivateModal(false)} className="flex-1 border border-gray-300 px-6 py-3 rounded-full font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AdminPlayers;