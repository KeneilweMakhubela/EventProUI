import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SponsorProfile = () => {
  const { apiCall } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [editForm, setEditForm] = useState({
    companyName: '',
    registrationNumber: '',
    taxNumber: '',
    industry: '',
    companySize: '',
    email: '',
    phoneNumber: '',
    website: '',
    linkedIn: '',
    twitter: '',
    facebook: '',
    streetAddress: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    logoUrl: '',
    bannerUrl: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/api/Sponsor/profile', 'GET');
      console.log('📥 Profile response:', response);
      
      if (response) {
        setProfile(response);
        setEditForm({
          companyName: response.companyName || '',
          registrationNumber: response.registrationNumber || '',
          taxNumber: response.taxNumber || '',
          industry: response.industry || '',
          companySize: response.companySize || '',
          email: response.email || '',
          phoneNumber: response.phoneNumber || '',
          website: response.website || '',
          linkedIn: response.linkedIn || '',
          twitter: response.twitter || '',
          facebook: response.facebook || '',
          streetAddress: response.streetAddress || '',
          city: response.city || '',
          province: response.province || '',
          postalCode: response.postalCode || '',
          country: response.country || 'South Africa',
          logoUrl: response.logoUrl || '',
          bannerUrl: response.bannerUrl || '',
        });
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      setSaveError('Failed to load profile. Please try again.');
      setTimeout(() => setSaveError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    
    if (!editForm.companyName || editForm.companyName.trim().length < 2) {
      errors.companyName = 'Company name is required (min 2 characters)';
    }
    if (!editForm.email || !emailRegex.test(editForm.email)) {
      errors.email = 'Valid email is required';
    }
    if (!editForm.phoneNumber || !phoneRegex.test(editForm.phoneNumber)) {
      errors.phoneNumber = 'Valid phone number is required (min 10 digits)';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getFieldError = (fieldName) => {
    const errors = validationErrors[fieldName];
    if (Array.isArray(errors)) {
      return errors.join(', ');
    }
    return errors || '';
  };

    const handleSave = async () => {
    if (!validateForm()) {
        setSaveError('Please fix the highlighted fields.');
        const firstError = document.querySelector('.border-red-300');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    try {
        // Build the data with ONLY the fields sponsors can update
        const dataToSave = {};

        // Required fields
        dataToSave.CompanyName = editForm.companyName.trim();
        dataToSave.Email = editForm.email.trim();
        dataToSave.PhoneNumber = editForm.phoneNumber.trim();

        // Optional fields - only add if they have values
        if (editForm.registrationNumber?.trim()) {
            dataToSave.RegistrationNumber = editForm.registrationNumber.trim();
        }
        if (editForm.taxNumber?.trim()) {
            dataToSave.TaxNumber = editForm.taxNumber.trim();
        }
        if (editForm.industry?.trim()) {
            dataToSave.Industry = editForm.industry.trim();
        }
        if (editForm.companySize?.trim()) {
            dataToSave.CompanySize = editForm.companySize.trim();
        }
        if (editForm.website?.trim()) {
            dataToSave.Website = editForm.website.trim();
        }
        if (editForm.linkedIn?.trim()) {
            dataToSave.LinkedIn = editForm.linkedIn.trim();
        }
        if (editForm.twitter?.trim()) {
            dataToSave.Twitter = editForm.twitter.trim();
        }
        if (editForm.facebook?.trim()) {
            dataToSave.Facebook = editForm.facebook.trim();
        }
        if (editForm.streetAddress?.trim()) {
            dataToSave.StreetAddress = editForm.streetAddress.trim();
        }
        if (editForm.city?.trim()) {
            dataToSave.City = editForm.city.trim();
        }
        if (editForm.province?.trim()) {
            dataToSave.Province = editForm.province.trim();
        }
        if (editForm.postalCode?.trim()) {
            dataToSave.PostalCode = editForm.postalCode.trim();
        }
        if (editForm.country?.trim()) {
            dataToSave.Country = editForm.country.trim();
        }
        if (editForm.logoUrl?.trim()) {
            dataToSave.LogoUrl = editForm.logoUrl.trim();
        }
        if (editForm.bannerUrl?.trim()) {
            dataToSave.BannerUrl = editForm.bannerUrl.trim();
        }

        // IMPORTANT: Do NOT send Status, RejectionReason, or IsActive
        // These are admin-only fields

        console.log('📤 Sending data:', JSON.stringify(dataToSave, null, 2));
        
        const response = await apiCall('/api/Sponsor/profile', 'PUT', dataToSave);
        console.log('✅ Profile updated:', response);
        
        setSaveSuccess('✅ Profile updated successfully!');
        setIsEditing(false);
        await fetchProfile();
        setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        
        // Log the full error
        console.log('Full error object:', error);
        
        // Check for validation errors
        if (error.errors) {
            console.log('Validation errors:', error.errors);
            const formattedErrors = {};
            Object.keys(error.errors).forEach(key => {
                formattedErrors[key] = Array.isArray(error.errors[key]) 
                    ? error.errors[key].join(', ') 
                    : error.errors[key];
            });
            setValidationErrors(formattedErrors);
            setSaveError('Please fix the highlighted fields.');
        } else if (error.response?.data?.errors) {
            const backendErrors = error.response.data.errors;
            const formattedErrors = {};
            Object.keys(backendErrors).forEach(key => {
                formattedErrors[key] = Array.isArray(backendErrors[key]) 
                    ? backendErrors[key].join(', ') 
                    : backendErrors[key];
            });
            setValidationErrors(formattedErrors);
            setSaveError('Please fix the highlighted fields.');
        } else if (error.message) {
            setSaveError(error.message);
        } else {
            setSaveError('Failed to update profile. Please try again.');
        }
        setTimeout(() => setSaveError(''), 5000);
    }
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-building text-6xl text-gray-300 mb-4"></i>
        <p className="text-gray-500">No sponsor profile found.</p>
        <p className="text-sm text-gray-400 mt-2">Please contact admin to set up your sponsor profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-user-circle text-[#02a2e0]"></i> Sponsor Profile
      </div>
      
      {saveSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 flex items-center gap-3">
          <i className="fas fa-check-circle text-green-500"></i>
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500"></i>
          {saveError}
        </div>
      )}

      {/* Validation Errors Summary */}
      {Object.keys(validationErrors).length > 0 && !saveError && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
          <p className="text-sm font-semibold text-yellow-800 mb-2">Please fix the following errors:</p>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-4">
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field}>
                <span className="font-medium">{field.replace(/([A-Z])/g, ' $1').trim()}:</span> {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-600">Status:</span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          profile.status === 'Active' ? 'bg-green-100 text-green-800' :
          profile.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
          profile.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          profile.status === 'Rejected' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {profile.status || 'N/A'}
        </span>
        {profile.approvedDate && (
          <span className="text-xs text-gray-400">
            Approved: {new Date(profile.approvedDate).toLocaleDateString()}
          </span>
        )}
        {profile.isActive !== undefined && (
          <span className={`text-xs ${profile.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {profile.isActive ? '✅ Active' : '❌ Inactive'}
          </span>
        )}
        {profile.rejectionReason && (
          <span className="text-xs text-red-500">
            Rejection Reason: {profile.rejectionReason}
          </span>
        )}
      </div>

      <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100">
        {isEditing ? (
          // Edit Mode
          <>
            <h3 className="text-lg font-semibold text-[#132149] mb-4">✏️ Edit Profile</h3>
            
            {/* Company Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="companyName" 
                  value={editForm.companyName} 
                  onChange={handleChange} 
                  className={`w-full p-3 rounded-2xl border-2 ${getFieldError('companyName') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} 
                />
                {getFieldError('companyName') && <p className="mt-1 text-xs text-red-500">{getFieldError('companyName')}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Email <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  name="email" 
                  value={editForm.email} 
                  onChange={handleChange} 
                  className={`w-full p-3 rounded-2xl border-2 ${getFieldError('email') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} 
                />
                {getFieldError('email') && <p className="mt-1 text-xs text-red-500">{getFieldError('email')}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input 
                  type="tel" 
                  name="phoneNumber" 
                  value={editForm.phoneNumber} 
                  onChange={handleChange} 
                  className={`w-full p-3 rounded-2xl border-2 ${getFieldError('phoneNumber') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} 
                />
                {getFieldError('phoneNumber') && <p className="mt-1 text-xs text-red-500">{getFieldError('phoneNumber')}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Registration Number</label>
                <input 
                  type="text" 
                  name="registrationNumber" 
                  value={editForm.registrationNumber} 
                  onChange={handleChange} 
                  placeholder="2023/123456/07"
                  className={`w-full p-3 rounded-2xl border-2 ${getFieldError('registrationNumber') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} 
                />
                {getFieldError('registrationNumber') && <p className="mt-1 text-xs text-red-500">{getFieldError('registrationNumber')}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Tax / VAT Number</label>
                <input 
                  type="text" 
                  name="taxNumber" 
                  value={editForm.taxNumber} 
                  onChange={handleChange} 
                  placeholder="Tax/VAT Number"
                  className={`w-full p-3 rounded-2xl border-2 ${getFieldError('taxNumber') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} 
                />
                {getFieldError('taxNumber') && <p className="mt-1 text-xs text-red-500">{getFieldError('taxNumber')}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Industry</label>
                <input 
                  type="text" 
                  name="industry" 
                  value={editForm.industry} 
                  onChange={handleChange} 
                  placeholder="Technology"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Company Size</label>
                <select 
                  name="companySize" 
                  value={editForm.companySize} 
                  onChange={handleChange}
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                >
                  <option value="">Select Size</option>
                  <option value="Small">Small (1-50)</option>
                  <option value="Medium">Medium (51-200)</option>
                  <option value="Large">Large (201-1000)</option>
                  <option value="Enterprise">Enterprise (1000+)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Website</label>
                <input 
                  type="url" 
                  name="website" 
                  value={editForm.website} 
                  onChange={handleChange} 
                  placeholder="https://example.com"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
                />
              </div>
            </div>

            {/* Social Media */}
            <h4 className="text-md font-semibold text-[#132149] mt-6 mb-3">🔗 Social Media</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">LinkedIn</label>
                <input 
                  type="url" 
                  name="linkedIn" 
                  value={editForm.linkedIn} 
                  onChange={handleChange} 
                  placeholder="https://linkedin.com/company/..."
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Twitter</label>
                <input 
                  type="url" 
                  name="twitter" 
                  value={editForm.twitter} 
                  onChange={handleChange} 
                  placeholder="https://twitter.com/..."
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Facebook</label>
                <input 
                  type="url" 
                  name="facebook" 
                  value={editForm.facebook} 
                  onChange={handleChange} 
                  placeholder="https://facebook.com/..."
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
                />
              </div>
            </div>

            {/* Address */}
            <h4 className="text-md font-semibold text-[#132149] mt-6 mb-3">📍 Address</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600 mb-1 block">Street Address</label>
                <input 
                  type="text" 
                  name="streetAddress" 
                  value={editForm.streetAddress} 
                  onChange={handleChange} 
                  placeholder="123 Tech Park"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">City</label>
                <input 
                  type="text" 
                  name="city" 
                  value={editForm.city} 
                  onChange={handleChange} 
                  placeholder="Johannesburg"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Province</label>
                <input 
                  type="text" 
                  name="province" 
                  value={editForm.province} 
                  onChange={handleChange} 
                  placeholder="Gauteng"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Postal Code</label>
                <input 
                  type="text" 
                  name="postalCode" 
                  value={editForm.postalCode} 
                  onChange={handleChange} 
                  placeholder="2196"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Country</label>
                <input 
                  type="text" 
                  name="country" 
                  value={editForm.country} 
                  onChange={handleChange} 
                  placeholder="South Africa"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
                />
              </div>
            </div>

            {/* Logo & Banner */}
            <h4 className="text-md font-semibold text-[#132149] mt-6 mb-3">🖼️ Media</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Logo URL</label>
                <input 
                  type="url" 
                  name="logoUrl" 
                  value={editForm.logoUrl} 
                  onChange={handleChange} 
                  placeholder="https://example.com/logo.png"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
                />
                {editForm.logoUrl && (
                  <div className="mt-2">
                    <img src={editForm.logoUrl} alt="Logo preview" className="h-16 w-16 object-contain rounded-lg border border-gray-200" />
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Banner URL</label>
                <input 
                  type="url" 
                  name="bannerUrl" 
                  value={editForm.bannerUrl} 
                  onChange={handleChange} 
                  placeholder="https://example.com/banner.png"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
                />
                {editForm.bannerUrl && (
                  <div className="mt-2">
                    <img src={editForm.bannerUrl} alt="Banner preview" className="h-16 w-full object-cover rounded-lg border border-gray-200" />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
              <button 
                onClick={handleSave} 
                className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2"
              >
                <i className="fas fa-save"></i> Save Changes
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setValidationErrors({});
                  setSaveError('');
                }} 
                className="border border-gray-300 px-6 py-3 rounded-full font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          // View Mode
          <>
            {/* Company Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-400">Company Name</p>
                <p className="font-semibold text-[#132149]">{profile.companyName}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-semibold text-[#132149]">{profile.email}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-400">Phone</p>
                <p className="font-semibold text-[#132149]">{profile.phoneNumber}</p>
              </div>
              {profile.registrationNumber && (
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">Registration Number</p>
                  <p className="font-semibold text-[#132149]">{profile.registrationNumber}</p>
                </div>
              )}
              {profile.taxNumber && (
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">Tax / VAT Number</p>
                  <p className="font-semibold text-[#132149]">{profile.taxNumber}</p>
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-400">Industry</p>
                <p className="font-semibold text-[#132149]">{profile.industry || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-400">Company Size</p>
                <p className="font-semibold text-[#132149]">{profile.companySize || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-400">Website</p>
                <p className="font-semibold text-[#132149]">
                  {profile.website ? (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#02a2e0] hover:underline">
                      {profile.website}
                    </a>
                  ) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Social Media */}
            {(profile.linkedIn || profile.twitter || profile.facebook) && (
              <>
                <h4 className="text-md font-semibold text-[#132149] mt-6 mb-3">🔗 Social Media</h4>
                <div className="grid grid-cols-3 gap-4">
                  {profile.linkedIn && (
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-400">LinkedIn</p>
                      <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" className="text-[#02a2e0] hover:underline text-sm break-all">
                        {profile.linkedIn}
                      </a>
                    </div>
                  )}
                  {profile.twitter && (
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-400">Twitter</p>
                      <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="text-[#02a2e0] hover:underline text-sm break-all">
                        {profile.twitter}
                      </a>
                    </div>
                  )}
                  {profile.facebook && (
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-400">Facebook</p>
                      <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="text-[#02a2e0] hover:underline text-sm break-all">
                        {profile.facebook}
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Address */}
            <h4 className="text-md font-semibold text-[#132149] mt-6 mb-3">📍 Address</h4>
            <div className="grid grid-cols-2 gap-4">
              {profile.streetAddress && (
                <div className="col-span-2 bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">Street Address</p>
                  <p className="font-semibold text-[#132149]">{profile.streetAddress}</p>
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-400">City</p>
                <p className="font-semibold text-[#132149]">{profile.city || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-400">Province</p>
                <p className="font-semibold text-[#132149]">{profile.province || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-400">Postal Code</p>
                <p className="font-semibold text-[#132149]">{profile.postalCode || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-400">Country</p>
                <p className="font-semibold text-[#132149]">{profile.country || 'South Africa'}</p>
              </div>
            </div>

            {/* Media */}
            {(profile.logoUrl || profile.bannerUrl) && (
              <>
                <h4 className="text-md font-semibold text-[#132149] mt-6 mb-3">🖼️ Media</h4>
                <div className="grid grid-cols-2 gap-4">
                  {profile.logoUrl && (
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-400">Logo</p>
                      <img src={profile.logoUrl} alt="Logo" className="h-20 w-20 object-contain rounded-lg border border-gray-200 mt-1" />
                    </div>
                  )}
                  {profile.bannerUrl && (
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-400">Banner</p>
                      <img src={profile.bannerUrl} alt="Banner" className="h-20 w-full object-cover rounded-lg border border-gray-200 mt-1" />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Edit Button */}
            <button 
              onClick={() => setIsEditing(true)} 
              className="mt-6 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold"
            >
              <i className="fas fa-edit mr-2"></i> Edit Profile
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SponsorProfile;