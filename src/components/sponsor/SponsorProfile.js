import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SponsorProfile = () => {
  const { apiCall } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [editForm, setEditForm] = useState({
    companyName: '',
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
    industry: '',
    companySize: '',
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
      if (response) {
        setProfile(response);
        setEditForm({
          companyName: response.companyName || '',
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
          industry: response.industry || '',
          companySize: response.companySize || '',
          logoUrl: response.logoUrl || '',
          bannerUrl: response.bannerUrl || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await apiCall('/api/Sponsor/profile', 'PUT', editForm);
      setSaveSuccess('Profile updated successfully!');
      setIsEditing(false);
      await fetchProfile();
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      setSaveError(error.message || 'Failed to update profile');
      setTimeout(() => setSaveError(''), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-building text-6xl text-gray-300 mb-4"></i>
        <p className="text-gray-500">No sponsor profile found.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#132149] mb-6">Sponsor Profile</h2>
      
      {saveSuccess && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700">{saveSuccess}</div>}
      {saveError && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">{saveError}</div>}

      <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100">
        {isEditing ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Company Name</label>
                <input type="text" name="companyName" value={editForm.companyName} onChange={handleChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Email</label>
                <input type="email" name="email" value={editForm.email} onChange={handleChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Phone</label>
                <input type="tel" name="phoneNumber" value={editForm.phoneNumber} onChange={handleChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Website</label>
                <input type="url" name="website" value={editForm.website} onChange={handleChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold">Save</button>
              <button onClick={() => setIsEditing(false)} className="border border-gray-300 px-6 py-3 rounded-full font-semibold">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400">Company Name</p><p className="font-semibold">{profile.companyName}</p></div>
              <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400">Email</p><p className="font-semibold">{profile.email}</p></div>
              <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400">Phone</p><p className="font-semibold">{profile.phoneNumber}</p></div>
              <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400">Website</p><p className="font-semibold">{profile.website || 'N/A'}</p></div>
            </div>
            <button onClick={() => setIsEditing(true)} className="mt-4 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold">
              <i className="fas fa-edit mr-2"></i> Edit Profile
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SponsorProfile;