import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, updateUser, apiCall } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
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
    isActive: true,
    attendance: '',
    category: '',
    diet: '',
    handicapIndex: '',
    organisation: '',
    role: 'player',
    sagaAssociated: 'no',
    shirtSize: '',
    sponsor: '',
    status: 'active',
    playerId: null,
  });

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || '',
        address: user.address || '',
        city: user.city || '',
        province: user.province || '',
        postalCode: user.postalCode || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactNumber: user.emergencyContactNumber || '',
        profileImageUrl: user.profileImageUrl || '',
        isActive: user.isActive !== undefined ? user.isActive : true,
        attendance: user.attendance || '',
        category: user.category || '',
        diet: user.diet || '',
        handicapIndex: user.handicapIndex !== undefined ? user.handicapIndex : '',
        organisation: user.organisation || '',
        role: user.role || 'player',
        sagaAssociated: user.sagaAssociated || 'no',
        shirtSize: user.shirtSize || '',
        sponsor: user.sponsor || '',
        status: user.status || 'active',
        playerId: user.playerId || null,
      }));
    }
  }, [user]);

  // Fetch profile from API using the working endpoint
  const fetchProfile = useCallback(async () => {
    // Use the user's ID from the auth context
    if (!user?.id) {
      console.warn('⚠️ No user ID available for fetching profile');
      return;
    }

    try {
      const response = await apiCall(`/api/Players/${user.id}`, 'GET');
      if (response) {
        setFormData(prev => ({
          ...prev,
          playerId: response.id,
          fullName: response.fullName || prev.fullName,
          email: response.email || prev.email,
          phoneNumber: response.phoneNumber || prev.phoneNumber,
          dateOfBirth: response.dateOfBirth ? response.dateOfBirth.split('T')[0] : prev.dateOfBirth,
          gender: response.gender || prev.gender,
          address: response.address || prev.address,
          city: response.city || prev.city,
          province: response.province || prev.province,
          postalCode: response.postalCode || prev.postalCode,
          emergencyContactName: response.emergencyContactName || prev.emergencyContactName,
          emergencyContactNumber: response.emergencyContactNumber || prev.emergencyContactNumber,
          profileImageUrl: response.profileImageUrl || prev.profileImageUrl,
          isActive: response.isActive !== undefined ? response.isActive : prev.isActive,
          attendance: response.attendance || prev.attendance,
          category: response.category || prev.category,
          diet: response.diet || prev.diet,
          handicapIndex: response.handicapIndex !== undefined ? response.handicapIndex : prev.handicapIndex,
          organisation: response.organisation || prev.organisation,
          role: response.role || prev.role,
          sagaAssociated: response.sagaAssociated || prev.sagaAssociated,
          shirtSize: response.shirtSize || prev.shirtSize,
          sponsor: response.sponsor || prev.sponsor,
          status: response.status || prev.status,
        }));
      }
    } catch (error) {
      console.log('⚠️ Could not fetch profile:', error.message);
    }
  }, [user, apiCall]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
    setIsSaved(false);
    setSaveError('');
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSaveError('');
    setValidationErrors({});

    // Get the player ID - either from formData or user
    const playerId = formData.playerId || user?.id;
    
    if (!playerId) {
      setSaveError('User ID not found. Please log in again.');
      setIsLoading(false);
      return;
    }

    // Build payload matching your API exactly
    const dataToSave = {
      fullName: formData.fullName?.trim() || '',
      email: formData.email?.trim() || '',
      phoneNumber: formData.phoneNumber?.trim() || '',
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
      gender: formData.gender || '',
      address: formData.address?.trim() || '',
      city: formData.city?.trim() || '',
      province: formData.province || '',
      postalCode: formData.postalCode?.trim() || '',
      emergencyContactName: formData.emergencyContactName?.trim() || '',
      emergencyContactNumber: formData.emergencyContactNumber?.trim() || '',
      profileImageUrl: formData.profileImageUrl?.trim() || '',
      isActive: formData.isActive,
      attendance: formData.attendance || '',
      category: formData.category || '',
      diet: formData.diet || '',
      handicapIndex: formData.handicapIndex || '',
      organisation: formData.organisation?.trim() || '',
      role: formData.role || 'player',
      sagaAssociated: formData.sagaAssociated || 'no',
      shirtSize: formData.shirtSize || '',
      sponsor: formData.sponsor?.trim() || '',
      status: formData.status || 'active',
    };

    console.log('📤 Sending to API:', JSON.stringify(dataToSave, null, 2));

    try {
      const response = await apiCall(`/api/Players/${playerId}`, 'PUT', dataToSave);

      if (response) {
        // Update local user data
        const updatedData = {
          ...dataToSave,
          updatedAt: response.updatedAt || new Date().toISOString(),
        };
        updateUser(updatedData);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      
      // Display field-specific validation errors
      if (error.details) {
        setValidationErrors(error.details);
        setSaveError('Please fix the highlighted fields.');
      } else {
        setSaveError(error.message || 'Failed to update profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
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
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];
  const dietOptions = [
    '', 'None', 'Vegetarian', 'Vegan', 'Gluten-Free',
    'Halal', 'Kosher', 'Dairy-Free', 'Nut-Free', 'Pescatarian', 'Other'
  ];
  const roleOptions = ['player', 'sponsor', 'admin'];
  const statusOptions = ['active', 'inactive', 'suspended', 'pending'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Player': return 'bg-blue-100 text-blue-800';
      case 'Attendee': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <>
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-id-card text-[#02a2e0]"></i> My Profile
      </div>

      <div className="card-gradient rounded-3xl shadow-sm border border-gray-100">
        {/* Profile Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              {formData.profileImageUrl ? (
                <img
                  src={formData.profileImageUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-16 h-16 bg-gradient-to-br from-[#02a2e0] to-[#00a5df] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ${formData.profileImageUrl ? 'hidden' : 'flex'}`}
              >
                {formData.fullName?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#132149]">
                {formData.fullName || 'Your Name'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(formData.status)}`}>
                  {formData.status?.charAt(0).toUpperCase() + formData.status?.slice(1)}
                </span>
                {formData.category && (
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(formData.category)}`}>
                    {formData.category}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {formData.role === 'admin' ? 'Administrator' :
                  formData.role === 'sponsor' ? 'Sponsor' : 'Player'}
                {formData.organisation && ` • ${formData.organisation}`}
              </p>
              {formData.playerId && (
                <p className="text-xs text-gray-400 mt-1">Player ID: {formData.playerId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-6">
          {/* Error Message */}
          {saveError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-red-500 text-lg"></i>
              <div className="flex-1">
                <p className="text-sm text-red-700 font-medium">Failed to update profile</p>
                <p className="text-xs text-red-500 mt-1">{saveError}</p>
              </div>
              <button
                onClick={() => setSaveError('')}
                className="text-red-400 hover:text-red-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          {/* Validation Errors Summary */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
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

          {/* Section: Personal Information */}
          <div className="mb-8">
            <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
              <i className="fas fa-user-circle text-[#02a2e0]"></i> Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-user text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
                  />
                </div>
                {getFieldError('fullName') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('fullName')}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-envelope text-gray-400"></i>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
                  />
                </div>
                {getFieldError('email') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('email')}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-phone text-gray-400"></i>
                  </div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+27 123 456 7890"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
                  />
                </div>
                {getFieldError('phoneNumber') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('phoneNumber')}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-calendar text-gray-400"></i>
                  </div>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
                  />
                </div>
                {getFieldError('dateOfBirth') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('dateOfBirth')}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-venus-mars text-gray-400"></i>
                  </div>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all appearance-none"
                  >
                    {genderOptions.map(opt => (
                      <option key={opt} value={opt}>{opt || 'Select Gender'}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
                {getFieldError('gender') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('gender')}</p>
                )}
              </div>

              {/* Profile Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-image text-gray-400"></i>
                  </div>
                  <input
                    type="url"
                    name="profileImageUrl"
                    value={formData.profileImageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
                  />
                </div>
                {getFieldError('profileImageUrl') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('profileImageUrl')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Address Information */}
          <div className="mb-8">
            <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-[#02a2e0]"></i> Address Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none">
                    <i className="fas fa-home text-gray-400 mt-1"></i>
                  </div>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main Street, Suburb"
                    rows="2"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all resize-none"
                  />
                </div>
                {getFieldError('address') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('address')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-city text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Johannesburg"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
                  />
                </div>
                {getFieldError('city') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('city')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-map text-gray-400"></i>
                  </div>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all appearance-none"
                  >
                    {provinceOptions.map(opt => (
                      <option key={opt} value={opt}>{opt || 'Select Province'}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
                {getFieldError('province') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('province')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-mail-bulk text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="2000"
                    maxLength="10"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
                  />
                </div>
                {getFieldError('postalCode') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('postalCode')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Emergency Contact */}
          <div className="mb-8">
            <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
              <i className="fas fa-phone-alt text-[#02a2e0]"></i> Emergency Contact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-user-friends text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
                  />
                </div>
                {getFieldError('emergencyContactName') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('emergencyContactName')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-phone-volume text-gray-400"></i>
                  </div>
                  <input
                    type="tel"
                    name="emergencyContactNumber"
                    value={formData.emergencyContactNumber}
                    onChange={handleChange}
                    placeholder="+27 987 654 3210"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
                  />
                </div>
                {getFieldError('emergencyContactNumber') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('emergencyContactNumber')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Sports & Event Details */}
          <div className="mb-8">
            <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
              <i className="fas fa-golf-ball text-[#02a2e0]"></i> Sports & Event Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-layer-group text-gray-400"></i>
                  </div>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all appearance-none"
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt} value={opt}>{opt || 'Select Category'}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
                {getFieldError('category') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('category')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attendance
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-calendar-check text-gray-400"></i>
                  </div>
                  <select
                    name="attendance"
                    value={formData.attendance}
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all appearance-none"
                  >
                    {attendanceOptions.map(opt => (
                      <option key={opt} value={opt}>{opt || 'Select Attendance'}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
                {getFieldError('attendance') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('attendance')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Handicap Index
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-chart-line text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    name="handicapIndex"
                    value={formData.handicapIndex}
                    onChange={handleChange}
                    placeholder="12.4"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
                  />
                </div>
                {getFieldError('handicapIndex') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('handicapIndex')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shirt Size
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-tshirt text-gray-400"></i>
                  </div>
                  <select
                    name="shirtSize"
                    value={formData.shirtSize}
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all appearance-none"
                  >
                    {shirtSizes.map(size => (
                      <option key={size} value={size}>{size || 'Select Size'}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
                {getFieldError('shirtSize') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('shirtSize')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SAGA Associated
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-certificate text-gray-400"></i>
                  </div>
                  <select
                    name="sagaAssociated"
                    value={formData.sagaAssociated}
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all appearance-none"
                  >
                    {sagaOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
                {getFieldError('sagaAssociated') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('sagaAssociated')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diet
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-utensils text-gray-400"></i>
                  </div>
                  <select
                    name="diet"
                    value={formData.diet}
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all appearance-none"
                  >
                    {dietOptions.map(opt => (
                      <option key={opt} value={opt}>{opt || 'Select Diet'}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
                {getFieldError('diet') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('diet')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Organisational Information */}
          <div className="mb-8">
            <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
              <i className="fas fa-building text-[#02a2e0]"></i> Organisational Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-user-tag text-gray-400"></i>
                  </div>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all appearance-none"
                  >
                    {roleOptions.map(opt => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
                {getFieldError('role') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('role')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organisation
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-sitemap text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    name="organisation"
                    value={formData.organisation}
                    onChange={handleChange}
                    placeholder="Company or Club Name"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
                  />
                </div>
                {getFieldError('organisation') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('organisation')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sponsor
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-star text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    name="sponsor"
                    value={formData.sponsor}
                    onChange={handleChange}
                    placeholder="Sponsor Name"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
                  />
                </div>
                {getFieldError('sponsor') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('sponsor')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-toggle-on text-gray-400"></i>
                  </div>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all appearance-none"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
                {getFieldError('status') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('status')}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 rounded-lg border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Active Account</span>
                    <p className="text-xs text-gray-400">Uncheck to deactivate your account</p>
                  </div>
                </label>
                {getFieldError('isActive') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('isActive')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="btn-primary-gradient text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Save Profile
                </>
              )}
            </button>

            {isSaved && (
              <span className="text-green-600 text-sm flex items-center gap-1 animate-pulse">
                <i className="fas fa-check-circle"></i> Profile updated successfully!
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                fetchProfile();
                setValidationErrors({});
                setIsSaved(false);
                setSaveError('');
              }}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <i className="fas fa-undo"></i> Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;