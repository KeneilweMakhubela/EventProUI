// components/sponsors/AllocatedPlayers.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../Modal';

const AllocatedPlayers = () => {
  const { apiCall } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  
  // Player Registration form - matches /api/Auth/register with confirm password
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Guest Registration form
  const [guestForm, setGuestForm] = useState({
    idNumber: '',
    name: '',
    surname: '',
    diet: '',
    attendance: '',
  });

  // Dietary Requirements Options
  const dietaryOptions = [
    { value: '', label: 'Select Dietary Requirement' },
    { value: 'None', label: 'None' },
    { value: 'Vegetarian', label: 'Vegetarian' },
    { value: 'Vegan', label: 'Vegan' },
    { value: 'Gluten-Free', label: 'Gluten-Free' },
    { value: 'Dairy-Free', label: 'Dairy-Free' },
    { value: 'Halal', label: 'Halal' },
    { value: 'Kosher', label: 'Kosher' },
    { value: 'Nut-Free', label: 'Nut-Free' },
    { value: 'Shellfish-Free', label: 'Shellfish-Free' },
    { value: 'Diabetic', label: 'Diabetic' },
    { value: 'Low-Carb', label: 'Low-Carb' },
    { value: 'Keto', label: 'Keto' },
    { value: 'Paleo', label: 'Paleo' },
    { value: 'Pescatarian', label: 'Pescatarian' },
    { value: 'Other', label: 'Other (Please specify)' },
  ];

  // Attendance Options
  const attendanceOptions = [
    { value: '', label: 'Select Attendance Type' },
    { value: 'Day Visit', label: 'Day Visit' },
    { value: 'Dinner Only', label: 'Dinner Only' },
    { value: 'Dinner and Golf', label: 'Dinner and Golf' },
    { value: 'Golf Only', label: 'Golf Only' },
  ];

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/api/Sponsor/my-allocations', 'GET');
      console.log('📥 Allocations response:', response);
      
      let allocationsData = [];
      if (Array.isArray(response)) {
        allocationsData = response;
      } else if (response && response.items) {
        allocationsData = response.items;
      } else if (response && response.data) {
        allocationsData = response.data;
      }
      
      setAllocations(allocationsData);
    } catch (error) {
      console.error('❌ Error fetching allocations:', error);
      setSaveError('Failed to load allocations. Please refresh the page.');
      setTimeout(() => setSaveError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const openRegisterModal = (allocation) => {
    setSelectedAllocation(allocation);
    setRegisterForm({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    });
    setShowRegisterModal(true);
  };

  const openGuestModal = (allocation) => {
    setSelectedAllocation(allocation);
    setGuestForm({
        idNumber: '',
        name: '',
        surname: '',
        diet: '',
        attendance: '',
    });
    // Log the allocation to see what eventId it has
    console.log('📦 Selected allocation:', allocation);
    console.log('📦 EventId from allocation:', allocation.eventId);
    setShowGuestModal(true);
};

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGuestChange = (e) => {
    const { name, value } = e.target;
    setGuestForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterPlayer = async () => {
    // Validate all fields
    if (!registerForm.firstName.trim()) {
      setSaveError('First name is required');
      return;
    }
    if (!registerForm.lastName.trim()) {
      setSaveError('Last name is required');
      return;
    }
    if (!registerForm.email.trim()) {
      setSaveError('Email is required');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email.trim())) {
      setSaveError('Please enter a valid email address');
      return;
    }
    
    if (!registerForm.password) {
      setSaveError('Password is required');
      return;
    }
    if (registerForm.password.length < 6) {
      setSaveError('Password must be at least 6 characters');
      return;
    }
    
    // Confirm password validation
    if (!registerForm.confirmPassword) {
      setSaveError('Please confirm your password');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setSaveError('Passwords do not match');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      // Send data exactly as the endpoint expects (without confirmPassword)
      const userData = {
        firstName: registerForm.firstName.trim(),
        lastName: registerForm.lastName.trim(),
        email: registerForm.email.trim(),
        phoneNumber: registerForm.phoneNumber.trim() || null,
        password: registerForm.password,
      };

      console.log('📤 Registering user:', userData);
      await apiCall('/api/Auth/register', 'POST', userData);
      console.log('✅ User registered successfully');
      
      setSaveSuccess('✅ Player registered successfully!');
      setShowRegisterModal(false);
      await fetchAllocations();
      setTimeout(() => setSaveSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Error registering user:', error);
      
      if (error.message?.includes('Email already registered')) {
        setSaveError('This email is already registered. Please use a different email.');
      } else {
        setSaveError(error.message || 'Failed to register player');
      }
      setTimeout(() => setSaveError(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterGuest = async () => {
    // Validate guest form
    if (!guestForm.idNumber.trim()) {
        setSaveError('ID number is required');
        return;
    }
    if (guestForm.idNumber.length < 6) {
        setSaveError('Please enter a valid ID number');
        return;
    }
    if (!guestForm.name.trim()) {
        setSaveError('Name is required');
        return;
    }
    if (!guestForm.surname.trim()) {
        setSaveError('Surname is required');
        return;
    }
    if (!guestForm.diet) {
        setSaveError('Please select a dietary requirement');
        return;
    }
    if (!guestForm.attendance) {
        setSaveError('Please select attendance type');
        return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
        // Use the eventId from the selected allocation
        const eventId = selectedAllocation.eventId;
        
        console.log('📤 Registering guest with data:', {
            idNumber: guestForm.idNumber.trim(),
            name: guestForm.name.trim(),
            surname: guestForm.surname.trim(),
            diet: guestForm.diet,
            attendance: guestForm.attendance,
            allocationId: selectedAllocation.allocationId,
            eventId: eventId,
        });

        // Validate that we have an eventId
        if (!eventId) {
            setSaveError('This allocation is not associated with an event. Please contact support.');
            setIsSaving(false);
            return;
        }

        const guestData = {
            idNumber: guestForm.idNumber.trim(),
            name: guestForm.name.trim(),
            surname: guestForm.surname.trim(),
            diet: guestForm.diet,
            attendance: guestForm.attendance,
            allocationId: selectedAllocation.allocationId,
            eventId: eventId, // Use the eventId from the allocation
        };

        const response = await apiCall('/api/Sponsor/register-guest', 'POST', guestData);
        console.log('✅ Guest registered successfully:', response);
        
        setSaveSuccess(`✅ Guest registered successfully! Remaining slots: ${response.remainingSlots}`);
        setShowGuestModal(false);
        await fetchAllocations();
        setTimeout(() => setSaveSuccess(''), 3000);
        
    } catch (error) {
        console.error('❌ Error registering guest:', error);
        
        if (error.message?.includes('Guest limit reached')) {
            setSaveError('Guest limit reached for this allocation');
        } else if (error.message?.includes('ID number is already registered')) {
            setSaveError('This ID number is already registered for this allocation');
        } else if (error.message?.includes('does not match the allocation')) {
            setSaveError('Event mismatch. Please contact support.');
        } else {
            setSaveError(error.message || 'Failed to register guest');
        }
        setTimeout(() => setSaveError(''), 5000);
    } finally {
        setIsSaving(false);
    }
};

  // ============================================================
  // UI HELPERS
  // ============================================================

  const formatCurrency = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Active': 'bg-green-100 text-green-800',
      'Completed': 'bg-blue-100 text-blue-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'P';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading allocations...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-user-plus text-[#02a2e0]"></i> Allocated Players
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

      {allocations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-3xl">
          <i className="fas fa-box-open text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">No allocations found</p>
          <p className="text-sm text-gray-400 mt-2">You haven't been allocated any packages yet.</p>
        </div>
      ) : (
        allocations.map(allocation => (
          <div key={allocation.allocationId} className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
            {/* Allocation Header */}
            <div className="flex flex-wrap items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-[#132149]">
                  {allocation.packageName}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatCurrency(allocation.packagePrice)} • {new Date(allocation.allocatedDate).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(allocation.status)}`}>
                    {allocation.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    Players: {allocation.players?.length || 0}/{allocation.golfPlayers || 0}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openRegisterModal(allocation)}
                  className="btn-primary-gradient text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
                >
                  <i className="fas fa-user-plus"></i> Register Player
                </button>
                <button
                  onClick={() => openGuestModal(allocation)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <i className="fas fa-user-friends"></i> Add Guest
                </button>
              </div>
            </div>

            {/* Players List */}
            {allocation.players && allocation.players.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allocation.players.map(player => (
                  <div key={player.playerId} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#02a2e0] to-[#00a5df] flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(player.firstName, player.lastName)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#132149]">
                          {player.firstName} {player.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{player.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <i className="fas fa-users text-3xl text-gray-300 mb-2"></i>
                <p className="text-gray-400 text-sm">No players registered yet</p>
                <div className="flex gap-2 justify-center mt-2">
                  <button
                    onClick={() => openRegisterModal(allocation)}
                    className="text-sm text-[#02a2e0] hover:text-[#0284c7] font-medium"
                  >
                    <i className="fas fa-user-plus mr-1"></i> Register player
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => openGuestModal(allocation)}
                    className="text-sm text-purple-500 hover:text-purple-600 font-medium"
                  >
                    <i className="fas fa-user-friends mr-1"></i> Add guest
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* ============================================================
          PLAYER REGISTRATION MODAL
          ============================================================ */}
      {showRegisterModal && selectedAllocation && (
        <Modal onClose={() => setShowRegisterModal(false)}>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-[#132149] mb-4">
              <i className="fas fa-user-plus text-[#02a2e0] mr-2"></i>
              Register Player
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Registering player for: <span className="font-semibold">{selectedAllocation.packageName}</span>
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={registerForm.firstName}
                    onChange={handleRegisterChange}
                    placeholder="John"
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={registerForm.lastName}
                    onChange={handleRegisterChange}
                    placeholder="Doe"
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  placeholder="john@example.com"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={registerForm.phoneNumber}
                  onChange={handleRegisterChange}
                  placeholder="+27721234567"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  placeholder="Min 6 characters"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="Confirm your password"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none"
                />
                {registerForm.confirmPassword && registerForm.password && registerForm.password !== registerForm.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    Passwords do not match
                  </p>
                )}
                {registerForm.confirmPassword && registerForm.password && registerForm.password === registerForm.confirmPassword && (
                  <p className="text-xs text-green-500 mt-1">
                    <i className="fas fa-check-circle mr-1"></i>
                    Passwords match
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
              <button
                onClick={handleRegisterPlayer}
                disabled={isSaving}
                className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Registering...</>
                ) : (
                  <><i className="fas fa-user-plus"></i> Register Player</>
                )}
              </button>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="border border-gray-300 px-6 py-3 rounded-full font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================
          GUEST REGISTRATION MODAL
          ============================================================ */}
      {showGuestModal && selectedAllocation && (
        <Modal onClose={() => setShowGuestModal(false)}>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-[#132149] mb-4">
              <i className="fas fa-user-friends text-purple-500 mr-2"></i>
              Add Guest
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Adding guest for: <span className="font-semibold">{selectedAllocation.packageName}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">ID Number *</label>
                <input
                  type="text"
                  name="idNumber"
                  value={guestForm.idNumber}
                  onChange={handleGuestChange}
                  placeholder="Enter ID number"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-white focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={guestForm.name}
                  onChange={handleGuestChange}
                  placeholder="Enter guest name"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-white focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Surname *</label>
                <input
                  type="text"
                  name="surname"
                  value={guestForm.surname}
                  onChange={handleGuestChange}
                  placeholder="Enter guest surname"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-white focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Dietary Requirements *</label>
                <select
                  name="diet"
                  value={guestForm.diet}
                  onChange={handleGuestChange}
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-white focus:border-purple-500 outline-none"
                >
                  {dietaryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Attendance Type *</label>
                <select
                  name="attendance"
                  value={guestForm.attendance}
                  onChange={handleGuestChange}
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-white focus:border-purple-500 outline-none"
                >
                  {attendanceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
              <button
                onClick={handleRegisterGuest}
                disabled={isSaving}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Adding Guest...</>
                ) : (
                  <><i className="fas fa-user-friends"></i> Add Guest</>
                )}
              </button>
              <button
                onClick={() => setShowGuestModal(false)}
                className="border border-gray-300 px-6 py-3 rounded-full font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AllocatedPlayers;