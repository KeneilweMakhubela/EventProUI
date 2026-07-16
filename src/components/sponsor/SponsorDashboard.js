import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../Modal';

const SponsorDashboard = () => {
  const { apiCall, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profile, setProfile] = useState(null);
  const [packages, setPackages] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
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
    contactPersons: [],
  });
  
  // Package request states
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  // RSVP states
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({
    eventId: '',
    attendeesCount: 1,
    specialRequests: '',
    dietaryRequirements: '',
  });
  
  // Payment proof states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    allocationId: '',
    amount: '',
    paymentDate: '',
    referenceNumber: '',
    file: null,
  });
  
  // Success/Error states
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchSponsorData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    
    try {
      const [profileRes, packagesRes, allocationsRes, rsvpsRes, eventsRes] = await Promise.all([
        apiCall('/api/Sponsor/profile', 'GET').catch(() => null),
        apiCall('/api/Sponsor/packages', 'GET').catch(() => []),
        apiCall('/api/Sponsor/my-allocations', 'GET').catch(() => []),
        apiCall('/api/Sponsor/my-rsvps', 'GET').catch(() => []),
        apiCall('/api/Events?page=1&pageSize=100', 'GET').catch(() => ({ items: [] })),
      ]);

      setProfile(profileRes);
      setPackages(packagesRes || []);
      setAllocations(allocationsRes || []);
      setRsvps(rsvpsRes || []);
      setEvents(eventsRes?.items || []);
      
      // Set edit form when profile loads
      if (profileRes) {
        setEditForm({
          companyName: profileRes.companyName || '',
          email: profileRes.email || '',
          phoneNumber: profileRes.phoneNumber || '',
          website: profileRes.website || '',
          linkedIn: profileRes.linkedIn || '',
          twitter: profileRes.twitter || '',
          facebook: profileRes.facebook || '',
          streetAddress: profileRes.streetAddress || '',
          city: profileRes.city || '',
          province: profileRes.province || '',
          postalCode: profileRes.postalCode || '',
          country: profileRes.country || 'South Africa',
          industry: profileRes.industry || '',
          companySize: profileRes.companySize || '',
          logoUrl: profileRes.logoUrl || '',
          bannerUrl: profileRes.bannerUrl || '',
          contactPersons: profileRes.contactPersons || [],
        });
      }
    } catch (error) {
      console.error('❌ Error fetching sponsor data:', error);
      setLoadError('Failed to load sponsor data');
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchSponsorData();
  }, [fetchSponsorData]);

  // ============================================================
  // PROFILE HANDLERS
  // ============================================================

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleContactChange = (index, field, value) => {
    setEditForm(prev => {
      const updated = [...prev.contactPersons];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, contactPersons: updated };
    });
  };

  const addContactPerson = () => {
    setEditForm(prev => ({
      ...prev,
      contactPersons: [
        ...prev.contactPersons,
        { fullName: '', email: '', phoneNumber: '', jobTitle: '', department: '', isPrimary: false }
      ]
    }));
  };

  const removeContactPerson = (index) => {
    if (editForm.contactPersons.length <= 1) return;
    setEditForm(prev => ({
      ...prev,
      contactPersons: prev.contactPersons.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError('');
    setValidationErrors({});

    const dataToSave = {
      companyName: editForm.companyName.trim(),
      email: editForm.email.trim(),
      phoneNumber: editForm.phoneNumber.trim(),
      website: editForm.website?.trim() || null,
      linkedIn: editForm.linkedIn?.trim() || null,
      twitter: editForm.twitter?.trim() || null,
      facebook: editForm.facebook?.trim() || null,
      streetAddress: editForm.streetAddress?.trim() || null,
      city: editForm.city?.trim() || null,
      province: editForm.province?.trim() || null,
      postalCode: editForm.postalCode?.trim() || null,
      country: editForm.country || 'South Africa',
      industry: editForm.industry?.trim() || null,
      companySize: editForm.companySize?.trim() || null,
      logoUrl: editForm.logoUrl?.trim() || null,
      bannerUrl: editForm.bannerUrl?.trim() || null,
    };

    try {
      await apiCall('/api/Sponsor/profile', 'PUT', dataToSave);
      setSaveSuccess('Profile updated successfully!');
      setIsEditing(false);
      await fetchSponsorData();
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      if (error.details) {
        setValidationErrors(error.details);
        setSaveError('Please fix the highlighted fields.');
      } else {
        setSaveError(error.message || 'Failed to update profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // PACKAGE HANDLERS
  // ============================================================

  const handleRequestPackage = async (packageId) => {
    setIsSaving(true);
    setSaveError('');
    try {
      await apiCall('/api/Sponsor/request-package', 'POST', { packageId });
      setSaveSuccess('Package request submitted successfully!');
      await fetchSponsorData();
      setShowPackageModal(false);
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error requesting package:', error);
      setSaveError(error.message || 'Failed to request package');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // RSVP HANDLERS
  // ============================================================

  const handleRSVPChange = (e) => {
    const { name, value } = e.target;
    setRsvpForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateRSVP = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await apiCall('/api/Sponsor/rsvp', 'POST', rsvpForm);
      setSaveSuccess('RSVP submitted successfully!');
      await fetchSponsorData();
      setShowRSVPModal(false);
      setRsvpForm({ eventId: '', attendeesCount: 1, specialRequests: '', dietaryRequirements: '' });
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error creating RSVP:', error);
      setSaveError(error.message || 'Failed to create RSVP');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelRSVP = async (rsvpId) => {
    if (!window.confirm('Are you sure you want to cancel this RSVP?')) return;
    try {
      await apiCall(`/api/Sponsor/rsvp/${rsvpId}`, 'DELETE');
      setSaveSuccess('RSVP cancelled successfully!');
      await fetchSponsorData();
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error cancelling RSVP:', error);
      setSaveError(error.message || 'Failed to cancel RSVP');
    }
  };

  // ============================================================
  // PAYMENT PROOF HANDLERS
  // ============================================================

  const handlePaymentChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setPaymentForm(prev => ({ ...prev, file: files[0] }));
    } else {
      setPaymentForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUploadPaymentProof = async () => {
    if (!paymentForm.file) {
        setSaveError('Please select a file to upload');
        return;
    }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
        setSaveError('Please enter a valid amount');
        return;
    }
    if (!paymentForm.paymentDate) {
        setSaveError('Please select a payment date');
        return;
    }

    setIsSaving(true);
    setSaveError('');
    
    const formData = new FormData();
    formData.append('File', paymentForm.file);
    formData.append('Amount', paymentForm.amount.toString());
    formData.append('PaymentDate', paymentForm.paymentDate);
    if (paymentForm.referenceNumber) {
        formData.append('ReferenceNumber', paymentForm.referenceNumber);
    }

    try {
        const token = localStorage.getItem('eventProToken');
        const response = await fetch(`https://localhost:7119/api/Sponsor/upload-payment-proof/${paymentForm.allocationId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = 'Failed to upload payment proof';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.title || errorMessage;
            } catch (e) {
                // If response is not JSON
                errorMessage = `Upload failed with status ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ Payment proof uploaded:', data);
        
        setSaveSuccess('Payment proof uploaded successfully!');
        await fetchSponsorData();
        setShowPaymentModal(false);
        setPaymentForm({ 
            allocationId: '', 
            amount: '', 
            paymentDate: '', 
            referenceNumber: '', 
            file: null 
        });
        setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
        console.error('❌ Error uploading payment proof:', error);
        setSaveError(error.message || 'Failed to upload payment proof');
        setTimeout(() => setSaveError(''), 5000);
    } finally {
        setIsSaving(false);
    }
};

  // ============================================================
  // UI HELPERS
  // ============================================================

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'active':
      case 'confirmed':
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = {
    totalPackages: packages.length,
    activeAllocations: allocations.filter(a => a.status === 'Active').length,
    pendingAllocations: allocations.filter(a => a.status === 'Pending').length,
    totalRSVPs: rsvps.length,
    confirmedRSVPs: rsvps.filter(r => r.status === 'Confirmed').length,
  };

  // ============================================================
  // RENDER METHODS
  // ============================================================

  const renderDashboard = () => (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-[#132149]">{stats.totalPackages}</div>
          <div className="text-xs text-gray-500">Available Packages</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{stats.activeAllocations}</div>
          <div className="text-xs text-gray-500">Active Allocations</div>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">{stats.pendingAllocations}</div>
          <div className="text-xs text-gray-500">Pending Allocations</div>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">{stats.confirmedRSVPs}</div>
          <div className="text-xs text-gray-500">Confirmed RSVPs</div>
        </div>
      </div>

      {/* Company Info */}
      <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#02a2e0] to-[#00a5df] rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt={profile.companyName} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              profile.companyName?.charAt(0).toUpperCase() || 'S'
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#132149]">{profile.companyName}</h3>
            <p className="text-sm text-gray-500">{profile.email} • {profile.phoneNumber}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              {profile.status || 'Active'}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className="ml-auto btn-primary-gradient text-white px-4 py-2 rounded-full text-sm font-semibold"
          >
            <i className="fas fa-edit mr-1"></i> Edit Profile
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => setActiveTab('packages')}
          className="card-gradient rounded-2xl p-4 text-center border border-gray-100 hover:shadow-md transition-all"
        >
          <i className="fas fa-gift text-[#02a2e0] text-xl mb-2"></i>
          <p className="text-sm font-semibold text-[#132149]">View Packages</p>
        </button>
        <button 
          onClick={() => setActiveTab('allocations')}
          className="card-gradient rounded-2xl p-4 text-center border border-gray-100 hover:shadow-md transition-all"
        >
          <i className="fas fa-check-circle text-[#02a2e0] text-xl mb-2"></i>
          <p className="text-sm font-semibold text-[#132149]">My Allocations</p>
        </button>
        <button 
          onClick={() => setActiveTab('rsvps')}
          className="card-gradient rounded-2xl p-4 text-center border border-gray-100 hover:shadow-md transition-all"
        >
          <i className="fas fa-calendar-check text-[#02a2e0] text-xl mb-2"></i>
          <p className="text-sm font-semibold text-[#132149]">My RSVPs</p>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className="card-gradient rounded-2xl p-4 text-center border border-gray-100 hover:shadow-md transition-all"
        >
          <i className="fas fa-building text-[#02a2e0] text-xl mb-2"></i>
          <p className="text-sm font-semibold text-[#132149]">Edit Profile</p>
        </button>
      </div>
    </>
  );

  const renderProfile = () => (
    <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-[#132149] mb-4">
        {isEditing ? '✏️ Edit Profile' : '📋 Company Profile'}
      </h3>
      
      {isEditing ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Company Name *</label>
              <input type="text" name="companyName" value={editForm.companyName} onChange={handleProfileChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Email *</label>
              <input type="email" name="email" value={editForm.email} onChange={handleProfileChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Phone *</label>
              <input type="tel" name="phoneNumber" value={editForm.phoneNumber} onChange={handleProfileChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Website</label>
              <input type="url" name="website" value={editForm.website} onChange={handleProfileChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Street Address</label>
              <input type="text" name="streetAddress" value={editForm.streetAddress} onChange={handleProfileChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">City</label>
              <input type="text" name="city" value={editForm.city} onChange={handleProfileChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Province</label>
              <input type="text" name="province" value={editForm.province} onChange={handleProfileChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Industry</label>
              <input type="text" name="industry" value={editForm.industry} onChange={handleProfileChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Company Size</label>
              <select name="companySize" value={editForm.companySize} onChange={handleProfileChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none">
                <option value="">Select Size</option>
                <option value="Small">Small (1-50)</option>
                <option value="Medium">Medium (51-200)</option>
                <option value="Large">Large (201-1000)</option>
                <option value="Enterprise">Enterprise (1000+)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Logo URL</label>
              <input type="url" name="logoUrl" value={editForm.logoUrl} onChange={handleProfileChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Banner URL</label>
              <input type="url" name="bannerUrl" value={editForm.bannerUrl} onChange={handleProfileChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button onClick={handleSaveProfile} disabled={isSaving} className="btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
            <button onClick={() => setIsEditing(false)} className="border border-gray-300 px-6 py-3 rounded-full font-semibold">Cancel</button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-400">Company Name</p>
            <p className="font-semibold">{profile.companyName}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-400">Email</p>
            <p className="font-semibold">{profile.email}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-400">Phone</p>
            <p className="font-semibold">{profile.phoneNumber}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-400">Website</p>
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#02a2e0] hover:underline">{profile.website || 'N/A'}</a>
          </div>
          {profile.streetAddress && (
            <div className="bg-gray-50 p-3 rounded-xl col-span-2">
              <p className="text-xs text-gray-400">Address</p>
              <p className="font-semibold">{profile.streetAddress}, {profile.city}{profile.province ? `, ${profile.province}` : ''} {profile.postalCode}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderPackages = () => (
    <div>
      <h3 className="text-lg font-semibold text-[#132149] mb-4">📦 Available Sponsorship Packages</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.length === 0 ? (
          <div className="col-span-2 text-center py-8 bg-gray-50 rounded-3xl">
            <p className="text-gray-500">No packages available</p>
          </div>
        ) : (
          packages.filter(p => p.isActive).map(pkg => (
            <div key={pkg.packageId} className="card-gradient rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-[#132149]">{pkg.packageName}</h4>
                <span className="text-sm font-bold text-[#02a2e0]">{formatCurrency(pkg.price)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{pkg.description || 'Standard package'}</p>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <span className="text-gray-400 block text-xs">Golf Players</span>
                  <span className="font-semibold">{pkg.golfPlayers}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <span className="text-gray-400 block text-xs">Additional Guests</span>
                  <span className="font-semibold">{pkg.additionalGuests}</span>
                </div>
              </div>
              <button
                onClick={() => { setSelectedPackage(pkg); setShowPackageModal(true); }}
                className="w-full mt-3 btn-primary-gradient text-white py-2 rounded-full text-sm font-semibold"
              >
                Request This Package
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAllocations = () => (
    <div>
      <h3 className="text-lg font-semibold text-[#132149] mb-4">✅ My Allocations</h3>
      {allocations.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-3xl">
          <p className="text-gray-500">No allocations yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allocations.map(allocation => (
            <div key={allocation.allocationId} className="card-gradient rounded-2xl p-5 border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-[#132149]">{allocation.packageName}</h4>
                  <p className="text-sm text-gray-500">Allocated: {formatDate(allocation.allocatedDate)}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(allocation.status)}`}>{allocation.status}</span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusBadge(allocation.paymentStatus)}`}>{allocation.paymentStatus}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <span className="text-gray-400 block text-xs">Amount</span>
                  <span className="font-semibold">{formatCurrency(allocation.packagePrice)}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <span className="text-gray-400 block text-xs">Status</span>
                  <span className="font-semibold">{allocation.status}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <span className="text-gray-400 block text-xs">Payment</span>
                  <span className="font-semibold">{allocation.paymentStatus}</span>
                </div>
              </div>
              {allocation.paymentStatus === 'Pending' && allocation.status !== 'Expired' && (
                <button
                  onClick={() => { setPaymentForm(prev => ({ ...prev, allocationId: allocation.allocationId })); setShowPaymentModal(true); }}
                  className="mt-3 btn-primary-gradient text-white px-4 py-2 rounded-full text-sm font-semibold"
                >
                  <i className="fas fa-upload mr-1"></i> Upload Payment Proof
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRSVPs = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#132149]">📋 My RSVPs</h3>
        <button onClick={() => setShowRSVPModal(true)} className="btn-primary-gradient text-white px-4 py-2 rounded-full text-sm font-semibold">
          <i className="fas fa-plus mr-1"></i> New RSVP
        </button>
      </div>
      {rsvps.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-3xl">
          <p className="text-gray-500">No RSVPs yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rsvps.map(rsvp => (
            <div key={rsvp.rsvpId} className="card-gradient rounded-2xl p-5 border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-[#132149]">{rsvp.eventName}</h4>
                  <p className="text-sm text-gray-500">{formatDate(rsvp.eventStartDate)}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(rsvp.status)}`}>{rsvp.status}</span>
                  <p className="text-sm text-gray-500 mt-1">{rsvp.attendeesCount} attendees</p>
                </div>
              </div>
              {rsvp.specialRequests && <p className="text-sm text-gray-500 mt-2"><span className="font-medium">Special Requests:</span> {rsvp.specialRequests}</p>}
              {rsvp.dietaryRequirements && <p className="text-sm text-gray-500"><span className="font-medium">Dietary:</span> {rsvp.dietaryRequirements}</p>}
              {rsvp.status !== 'Confirmed' && rsvp.status !== 'Cancelled' && (
                <button onClick={() => handleCancelRSVP(rsvp.rsvpId)} className="mt-2 text-red-500 text-sm hover:underline">Cancel RSVP</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ============================================================
  // MAIN RENDER
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading sponsor dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
    <div className="text-center py-12">
      <i className="fas fa-building text-6xl text-gray-300 mb-4"></i>
      <p className="text-gray-500">You don't have a sponsor profile yet.</p>
      <button 
        onClick={() => window.location.href = '/sponsor-application'}
        className="mt-4 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold"
      >
        <i className="fas fa-paper-plane mr-2"></i> Apply for Sponsorship
      </button>
    </div>
  );
  }

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
      {loadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500"></i>
          <p className="text-sm text-red-700 flex-1">{loadError}</p>
          <button onClick={fetchSponsorData} className="text-red-500 hover:text-red-700">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-star text-[#02a2e0]"></i> Sponsor Dashboard
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
          { id: 'profile', label: 'Profile', icon: 'fa-building' },
          { id: 'packages', label: 'Packages', icon: 'fa-gift' },
          { id: 'allocations', label: 'Allocations', icon: 'fa-check-circle' },
          { id: 'rsvps', label: 'RSVPs', icon: 'fa-calendar-check' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-[#02a2e0] text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'profile' && renderProfile()}
      {activeTab === 'packages' && renderPackages()}
      {activeTab === 'allocations' && renderAllocations()}
      {activeTab === 'rsvps' && renderRSVPs()}

      {/* ============================================================
          PACKAGE REQUEST MODAL
          ============================================================ */}
      {showPackageModal && selectedPackage && (
        <Modal onClose={() => { setShowPackageModal(false); setSelectedPackage(null); }}>
          <div className="text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-xl font-bold text-[#132149] mb-2">Request Package</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to request the <strong>"{selectedPackage.packageName}"</strong> package?
            </p>
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-600">Price: <span className="font-bold">{formatCurrency(selectedPackage.price)}</span></p>
              <p className="text-sm text-gray-600">{selectedPackage.golfPlayers} Golf Players • {selectedPackage.additionalGuests} Guests</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleRequestPackage(selectedPackage.packageId)} disabled={isSaving} className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold disabled:opacity-50">
                {isSaving ? 'Submitting...' : 'Confirm Request'}
              </button>
              <button onClick={() => { setShowPackageModal(false); setSelectedPackage(null); }} className="flex-1 border border-gray-300 px-6 py-3 rounded-full font-semibold">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================
          RSVP MODAL
          ============================================================ */}
      {showRSVPModal && (
        <Modal onClose={() => { setShowRSVPModal(false); setRsvpForm({ eventId: '', attendeesCount: 1, specialRequests: '', dietaryRequirements: '' }); }}>
          <h3 className="text-xl font-bold text-[#132149] mb-4">📋 Create RSVP</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Select Event *</label>
              <select name="eventId" value={rsvpForm.eventId} onChange={handleRSVPChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none">
                <option value="">Select an event...</option>
                {events.filter(e => e.status === 'Published' || e.isActive).map(e => (
                  <option key={e.id} value={e.id}>{e.name} - {formatDate(e.startDateTime)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Number of Attendees *</label>
              <input type="number" name="attendeesCount" value={rsvpForm.attendeesCount} onChange={handleRSVPChange} min="1" max="100" className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Special Requests</label>
              <textarea name="specialRequests" value={rsvpForm.specialRequests} onChange={handleRSVPChange} rows="2" className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Dietary Requirements</label>
              <input type="text" name="dietaryRequirements" value={rsvpForm.dietaryRequirements} onChange={handleRSVPChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleCreateRSVP} disabled={isSaving} className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold disabled:opacity-50">
              {isSaving ? 'Submitting...' : 'Submit RSVP'}
            </button>
            <button onClick={() => { setShowRSVPModal(false); setRsvpForm({ eventId: '', attendeesCount: 1, specialRequests: '', dietaryRequirements: '' }); }} className="flex-1 border border-gray-300 px-6 py-3 rounded-full font-semibold">Cancel</button>
          </div>
        </Modal>
      )}

      {/* ============================================================
          PAYMENT PROOF MODAL
          ============================================================ */}
      {showPaymentModal && (
        <Modal onClose={() => { setShowPaymentModal(false); setPaymentForm({ allocationId: '', amount: '', paymentDate: '', referenceNumber: '', file: null }); }}>
          <h3 className="text-xl font-bold text-[#132149] mb-4">📤 Upload Payment Proof</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Amount *</label>
              <input type="number" name="amount" value={paymentForm.amount} onChange={handlePaymentChange} step="0.01" className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Payment Date *</label>
              <input type="date" name="paymentDate" value={paymentForm.paymentDate} onChange={handlePaymentChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Reference Number</label>
              <input type="text" name="referenceNumber" value={paymentForm.referenceNumber} onChange={handlePaymentChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Upload File (PDF or Image) *</label>
              <input type="file" name="file" onChange={handlePaymentChange} accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50" />
              <p className="text-xs text-gray-400 mt-1">Accepted: PDF, JPG, PNG, GIF, WEBP (Max 10MB)</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleUploadPaymentProof} disabled={isSaving} className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold disabled:opacity-50">
              {isSaving ? 'Uploading...' : 'Upload'}
            </button>
            <button onClick={() => { setShowPaymentModal(false); setPaymentForm({ allocationId: '', amount: '', paymentDate: '', referenceNumber: '', file: null }); }} className="flex-1 border border-gray-300 px-6 py-3 rounded-full font-semibold">Cancel</button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default SponsorDashboard;