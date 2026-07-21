import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, updateUser, apiCall } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false); // New state for edit mode
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
      const response = await apiCall(`/api/Players/profile`, 'PUT', dataToSave);

      if (response) {
        const updatedData = {
          ...dataToSave,
          updatedAt: response.updatedAt || new Date().toISOString(),
        };
        updateUser(updatedData);
        setIsSaved(true);
        setIsEditing(false); // Exit edit mode after successful save
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      
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

  // Cancel editing and revert to view mode
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Revert form data to current user data
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
      }));
    }
    setSaveError('');
    setValidationErrors({});
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

  const getFieldError = (fieldName) => {
    const errors = validationErrors[fieldName];
    if (Array.isArray(errors)) {
      return errors.join(', ');
    }
    return errors || '';
  };

  // Render read-only field
  const renderReadOnlyField = (label, value, icon) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <i className={`fas ${icon} text-gray-400`}></i>
        </div>
        <div className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-700">
          {value || '-'}
        </div>
      </div>
    </div>
  );

  // Render form field (editable)
  const renderFormField = (type, name, label, placeholder, icon, options = null) => {
    if (type === 'select') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className={`fas ${icon} text-gray-400`}></i>
            </div>
            <select
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all appearance-none"
            >
              {options.map(opt => (
                <option key={opt.value || opt} value={opt.value || opt}>
                  {opt.label || opt || `Select ${label}`}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
            </div>
          </div>
          {getFieldError(name) && (
            <p className="mt-1 text-xs text-red-500">{getFieldError(name)}</p>
          )}
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <div className="relative">
            <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none">
              <i className={`fas ${icon} text-gray-400 mt-1`}></i>
            </div>
            <textarea
              name={name}
              value={formData[name]}
              onChange={handleChange}
              placeholder={placeholder}
              rows="2"
              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all resize-none"
            />
          </div>
          {getFieldError(name) && (
            <p className="mt-1 text-xs text-red-500">{getFieldError(name)}</p>
          )}
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className={`fas ${icon} text-gray-400`}></i>
          </div>
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
          />
        </div>
        {getFieldError(name) && (
          <p className="mt-1 text-xs text-red-500">{getFieldError(name)}</p>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 text-2xl font-bold text-[#132149] mb-6">
        <div className="flex items-center gap-2">
          <i className="fas fa-id-card text-[#02a2e0]"></i> My Profile
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm bg-[#02a2e0] text-white px-4 py-2 rounded-full font-medium hover:bg-[#0288c4] transition-all flex items-center gap-2"
          >
            <i className="fas fa-edit"></i> Edit Profile
          </button>
        )}
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

          {isEditing ? (
            // EDIT MODE - Show editable form
            <>
              {/* Section: Personal Information */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
                  <i className="fas fa-user-circle text-[#02a2e0]"></i> Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {renderFormField('text', 'fullName', 'Full Name *', 'John Doe', 'fa-user')}
                  {renderFormField('email', 'email', 'Email *', 'you@example.com', 'fa-envelope')}
                  {renderFormField('tel', 'phoneNumber', 'Phone Number *', '+27 123 456 7890', 'fa-phone')}
                  {renderFormField('date', 'dateOfBirth', 'Date of Birth', '', 'fa-calendar')}
                  {renderFormField('select', 'gender', 'Gender', '', 'fa-venus-mars', genderOptions)}
                  {renderFormField('url', 'profileImageUrl', 'Profile Image URL', 'https://example.com/photo.jpg', 'fa-image')}
                </div>
              </div>

              {/* Section: Address Information */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-[#02a2e0]"></i> Address Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    {renderFormField('textarea', 'address', 'Address', '123 Main Street, Suburb', 'fa-home')}
                  </div>
                  {renderFormField('text', 'city', 'City', 'Johannesburg', 'fa-city')}
                  {renderFormField('select', 'province', 'Province', '', 'fa-map', provinceOptions)}
                  {renderFormField('text', 'postalCode', 'Postal Code', '2000', 'fa-mail-bulk')}
                </div>
              </div>

              {/* Section: Emergency Contact */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
                  <i className="fas fa-phone-alt text-[#02a2e0]"></i> Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {renderFormField('text', 'emergencyContactName', 'Contact Name', 'Jane Doe', 'fa-user-friends')}
                  {renderFormField('tel', 'emergencyContactNumber', 'Contact Number', '+27 987 654 3210', 'fa-phone-volume')}
                </div>
              </div>

              {/* Section: Sports & Event Details */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
                  <i className="fas fa-golf-ball text-[#02a2e0]"></i> Sports & Event Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {renderFormField('select', 'category', 'Category', '', 'fa-layer-group', categoryOptions)}
                  {renderFormField('select', 'attendance', 'Attendance', '', 'fa-calendar-check', attendanceOptions)}
                  {renderFormField('text', 'handicapIndex', 'Handicap Index', '12.4', 'fa-chart-line')}
                  {renderFormField('select', 'shirtSize', 'Shirt Size', '', 'fa-tshirt', shirtSizes)}
                  {renderFormField('select', 'sagaAssociated', 'SAGA Associated', '', 'fa-certificate', sagaOptions)}
                  {renderFormField('select', 'diet', 'Diet', '', 'fa-utensils', dietOptions)}
                </div>
              </div>

              {/* Section: Organisational Information */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
                  <i className="fas fa-building text-[#02a2e0]"></i> Organisational Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {renderFormField('select', 'role', 'Role', '', 'fa-user-tag', roleOptions)}
                  {renderFormField('text', 'organisation', 'Organisation', 'Company or Club Name', 'fa-sitemap')}
                  {renderFormField('text', 'sponsor', 'Sponsor', 'Sponsor Name', 'fa-star')}
                  {renderFormField('select', 'status', 'Status', '', 'fa-toggle-on', statusOptions)}
                  
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

              {/* Action Buttons - Edit Mode */}
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
                      <i className="fas fa-save"></i> Save Changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <i className="fas fa-times"></i> Cancel
                </button>

                {isSaved && (
                  <span className="text-green-600 text-sm flex items-center gap-1 animate-pulse">
                    <i className="fas fa-check-circle"></i> Profile updated successfully!
                  </span>
                )}
              </div>
            </>
          ) : (
            // VIEW MODE - Show read-only profile
            <>
              {/* Section: Personal Information */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
                  <i className="fas fa-user-circle text-[#02a2e0]"></i> Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {renderReadOnlyField('Full Name', formData.fullName, 'fa-user')}
                  {renderReadOnlyField('Email', formData.email, 'fa-envelope')}
                  {renderReadOnlyField('Phone Number', formData.phoneNumber, 'fa-phone')}
                  {renderReadOnlyField('Date of Birth', formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : '-', 'fa-calendar')}
                  {renderReadOnlyField('Gender', formData.gender || '-', 'fa-venus-mars')}
                  {renderReadOnlyField('Profile Image URL', formData.profileImageUrl || '-', 'fa-image')}
                </div>
              </div>

              {/* Section: Address Information */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-[#02a2e0]"></i> Address Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    {renderReadOnlyField('Address', formData.address || '-', 'fa-home')}
                  </div>
                  {renderReadOnlyField('City', formData.city || '-', 'fa-city')}
                  {renderReadOnlyField('Province', formData.province || '-', 'fa-map')}
                  {renderReadOnlyField('Postal Code', formData.postalCode || '-', 'fa-mail-bulk')}
                </div>
              </div>

              {/* Section: Emergency Contact */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
                  <i className="fas fa-phone-alt text-[#02a2e0]"></i> Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {renderReadOnlyField('Contact Name', formData.emergencyContactName || '-', 'fa-user-friends')}
                  {renderReadOnlyField('Contact Number', formData.emergencyContactNumber || '-', 'fa-phone-volume')}
                </div>
              </div>

              {/* Section: Sports & Event Details */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
                  <i className="fas fa-golf-ball text-[#02a2e0]"></i> Sports & Event Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {renderReadOnlyField('Category', formData.category || '-', 'fa-layer-group')}
                  {renderReadOnlyField('Attendance', formData.attendance || '-', 'fa-calendar-check')}
                  {renderReadOnlyField('Handicap Index', formData.handicapIndex || '-', 'fa-chart-line')}
                  {renderReadOnlyField('Shirt Size', formData.shirtSize || '-', 'fa-tshirt')}
                  {renderReadOnlyField('SAGA Associated', formData.sagaAssociated || '-', 'fa-certificate')}
                  {renderReadOnlyField('Diet', formData.diet || '-', 'fa-utensils')}
                </div>
              </div>

              {/* Section: Organisational Information */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-[#132149] mb-4 flex items-center gap-2">
                  <i className="fas fa-building text-[#02a2e0]"></i> Organisational Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {renderReadOnlyField('Role', formData.role ? formData.role.charAt(0).toUpperCase() + formData.role.slice(1) : '-', 'fa-user-tag')}
                  {renderReadOnlyField('Organisation', formData.organisation || '-', 'fa-sitemap')}
                  {renderReadOnlyField('Sponsor', formData.sponsor || '-', 'fa-star')}
                  {renderReadOnlyField('Status', formData.status ? formData.status.charAt(0).toUpperCase() + formData.status.slice(1) : '-', 'fa-toggle-on')}
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Status
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className={`fas ${formData.isActive ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'}`}></i>
                      </div>
                      <div className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-700">
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Mode Footer */}
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary-gradient text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                >
                  <i className="fas fa-edit"></i> Edit Profile
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;