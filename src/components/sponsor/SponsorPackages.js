import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../Modal';

const SponsorPackages = () => {
  const { apiCall, user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    packageName: '',
    price: '',
    description: '',
    golfPlayers: 0,
    additionalGuests: 0,
    brandingCaps: false,
    brandingAllocatedHole: false,
    brandingShirts: false,
    meetAndGreet: false,
    golfKitMerchandise: false,
    prizeGivingAcknowledgement: false,
    websiteAcknowledgement: false,
    seatWithANCLeadership: false,
    seatWithCOSATULeadership: false,
    premiumBranding: false,
    isActive: true,
  });
  const [requestNotes, setRequestNotes] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (user) {
      setIsAdmin(user.role === 'Admin' || user.role === 'admin');
    }
  }, [user]);

  // Fetch packages
  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/api/Sponsor/packages', 'GET');
      console.log('📥 Packages response:', response);
      
      let packagesData = [];
      if (Array.isArray(response)) {
        packagesData = response;
      } else if (response && response.items) {
        packagesData = response.items;
      } else if (response && response.data) {
        packagesData = response.data;
      }
      
      setPackages(packagesData);
    } catch (error) {
      console.error('❌ Error fetching packages:', error);
      setSaveError('Failed to load packages. Please refresh the page.');
      setTimeout(() => setSaveError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // ============================================================
  // FORM HANDLERS (Admin Only)
  // ============================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : parseInt(value) || 0
    }));
  };

  const openCreateForm = () => {
    setFormData({
      packageName: '',
      price: '',
      description: '',
      golfPlayers: 0,
      additionalGuests: 0,
      brandingCaps: false,
      brandingAllocatedHole: false,
      brandingShirts: false,
      meetAndGreet: false,
      golfKitMerchandise: false,
      prizeGivingAcknowledgement: false,
      websiteAcknowledgement: false,
      seatWithANCLeadership: false,
      seatWithCOSATULeadership: false,
      premiumBranding: false,
      isActive: true,
    });
    setSelectedPackage(null);
    setShowForm(true);
  };

  const openEditForm = (pkg) => {
    setFormData({
      packageName: pkg.packageName || '',
      price: pkg.price || '',
      description: pkg.description || '',
      golfPlayers: pkg.golfPlayers || 0,
      additionalGuests: pkg.additionalGuests || 0,
      brandingCaps: pkg.brandingCaps || false,
      brandingAllocatedHole: pkg.brandingAllocatedHole || false,
      brandingShirts: pkg.brandingShirts || false,
      meetAndGreet: pkg.meetAndGreet || false,
      golfKitMerchandise: pkg.golfKitMerchandise || false,
      prizeGivingAcknowledgement: pkg.prizeGivingAcknowledgement || false,
      websiteAcknowledgement: pkg.websiteAcknowledgement || false,
      seatWithANCLeadership: pkg.seatWithANCLeadership || false,
      seatWithCOSATULeadership: pkg.seatWithCOSATULeadership || false,
      premiumBranding: pkg.premiumBranding || false,
      isActive: pkg.isActive !== undefined ? pkg.isActive : true,
    });
    setSelectedPackage(pkg);
    setShowForm(true);
  };

  // ============================================================
  // CRUD OPERATIONS (Admin Only)
  // ============================================================

  const handleSavePackage = async () => {
    if (!formData.packageName.trim()) {
      setSaveError('Package name is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setSaveError('Valid price is required');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    const dataToSave = {
      packageName: formData.packageName.trim(),
      price: parseFloat(formData.price),
      description: formData.description?.trim() || null,
      golfPlayers: parseInt(formData.golfPlayers) || 0,
      additionalGuests: parseInt(formData.additionalGuests) || 0,
      brandingCaps: formData.brandingCaps,
      brandingAllocatedHole: formData.brandingAllocatedHole,
      brandingShirts: formData.brandingShirts,
      meetAndGreet: formData.meetAndGreet,
      golfKitMerchandise: formData.golfKitMerchandise,
      prizeGivingAcknowledgement: formData.prizeGivingAcknowledgement,
      websiteAcknowledgement: formData.websiteAcknowledgement,
      seatWithANCLeadership: formData.seatWithANCLeadership,
      seatWithCOSATULeadership: formData.seatWithCOSATULeadership,
      premiumBranding: formData.premiumBranding,
      isActive: formData.isActive,
    };

    try {
      let response;
      if (selectedPackage) {
        // Update existing package
        response = await apiCall(`/api/SponsorshipPackages/admin/${selectedPackage.packageId}`, 'PUT', dataToSave);
        setSaveSuccess('✅ Package updated successfully!');
      } else {
        // Create new package
        response = await apiCall('/api/SponsorshipPackages/admin/create', 'POST', dataToSave);
        setSaveSuccess('✅ Package created successfully!');
      }
      
      await fetchPackages();
      setTimeout(() => {
        setShowForm(false);
        setSaveSuccess('');
      }, 2000);
    } catch (error) {
      console.error('❌ Error saving package:', error);
      setSaveError(error.message || 'Failed to save package');
      setTimeout(() => setSaveError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePackage = async (pkg) => {
    if (!window.confirm(`Are you sure you want to delete "${pkg.packageName}"? This action cannot be undone.`)) {
      return;
    }

    setIsSaving(true);
    try {
      await apiCall(`/api/SponsorshipPackages/admin/${pkg.packageId}`, 'DELETE');
      setSaveSuccess(`✅ "${pkg.packageName}" deleted successfully!`);
      await fetchPackages();
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error deleting package:', error);
      setSaveError(error.message || 'Failed to delete package');
      setTimeout(() => setSaveError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (pkg) => {
    try {
      const newStatus = !pkg.isActive;
      await apiCall(`/api/SponsorshipPackages/admin/${pkg.packageId}/toggle-active`, 'PUT', { isActive: newStatus });
      setSaveSuccess(`✅ Package ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      await fetchPackages();
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error toggling package status:', error);
      setSaveError(error.message || 'Failed to update package status');
      setTimeout(() => setSaveError(''), 3000);
    }
  };

  // ============================================================
  // SPONSOR PACKAGE REQUEST
  // ============================================================

  const openRequestModal = (pkg) => {
    setSelectedPackage(pkg);
    setRequestNotes('');
    setShowRequestModal(true);
  };

  const handleRequestPackage = async () => {
    if (!selectedPackage) return;

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const response = await apiCall('/api/Sponsor/request-package', 'POST', {
        packageId: selectedPackage.packageId,
        notes: requestNotes.trim() || null,
      });
      
      console.log('✅ Package request response:', response);
      setSaveSuccess(`✅ Package "${selectedPackage.packageName}" requested successfully!`);
      setShowRequestModal(false);
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error requesting package:', error);
      setSaveError(error.message || 'Failed to request package');
      setTimeout(() => setSaveError(''), 3000);
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

  const getTier = (pkg) => {
    if (pkg.price >= 25000) return { tier: 'Platinum', color: 'from-gray-200 to-gray-300 text-gray-700' };
    if (pkg.price >= 10000) return { tier: 'Gold', color: 'from-yellow-100 to-yellow-200 text-yellow-800' };
    if (pkg.price >= 5000) return { tier: 'Silver', color: 'from-blue-100 to-blue-200 text-blue-800' };
    return { tier: 'Bronze', color: 'from-orange-100 to-orange-200 text-orange-800' };
  };

  const getBenefitIcon = (benefit, label) => {
    return benefit ? (
      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
        <i className="fas fa-check-circle text-green-500"></i> {label}
      </span>
    ) : null;
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-2xl font-bold text-[#132149]">
          <i className="fas fa-gift text-[#02a2e0]"></i> Sponsorship Packages
        </div>
        {isAdmin && (
          <button 
            onClick={openCreateForm}
            className="btn-primary-gradient text-white px-5 py-3 rounded-full text-sm font-semibold flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> Add Package
          </button>
        )}
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

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-gray-50 rounded-3xl">
            <i className="fas fa-box-open text-5xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">No packages available</p>
            {isAdmin && (
              <button 
                onClick={openCreateForm}
                className="mt-3 btn-primary-gradient text-white px-5 py-3 rounded-full text-sm font-semibold"
              >
                Create First Package
              </button>
            )}
          </div>
        ) : (
          packages.map(pkg => {
            const tierInfo = getTier(pkg);
            const benefits = [
              getBenefitIcon(pkg.brandingCaps, 'Caps'),
              getBenefitIcon(pkg.brandingAllocatedHole, 'Allocated Hole'),
              getBenefitIcon(pkg.brandingShirts, 'Shirts'),
              getBenefitIcon(pkg.meetAndGreet, 'Meet & Greet'),
              getBenefitIcon(pkg.golfKitMerchandise, 'Golf Kit'),
              getBenefitIcon(pkg.prizeGivingAcknowledgement, 'Prize Giving'),
              getBenefitIcon(pkg.websiteAcknowledgement, 'Website'),
              getBenefitIcon(pkg.seatWithANCLeadership, 'ANC Leadership'),
              getBenefitIcon(pkg.seatWithCOSATULeadership, 'COSATU Leadership'),
              getBenefitIcon(pkg.premiumBranding, 'Premium Branding'),
            ].filter(Boolean);

            return (
              <div 
                key={pkg.packageId} 
                className={`card-gradient rounded-2xl p-5 border ${pkg.isActive ? 'border-gray-100' : 'border-red-200 bg-red-50/30'} hover:shadow-md transition-all relative`}
              >
                {!pkg.isActive && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Inactive
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[#132149] text-lg">{pkg.packageName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${tierInfo.color}`}>
                    {tierInfo.tier}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-2">{pkg.description || 'No description available'}</p>
                
                <p className="text-2xl font-bold text-[#02a2e0]">
                  {formatCurrency(pkg.price)}
                </p>
                
                <p className="text-xs text-gray-400 mt-1">
                  <i className="fas fa-users mr-1"></i>
                  {pkg.golfPlayers || 0} Golfers • {pkg.additionalGuests || 0} Guests
                </p>

                {benefits.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {benefits}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                  {!isAdmin && pkg.isActive && (
                    <button 
                      onClick={() => openRequestModal(pkg)}
                      className="flex-1 btn-primary-gradient text-white px-4 py-2 rounded-full text-sm font-semibold"
                    >
                      <i className="fas fa-paper-plane mr-1"></i> Request
                    </button>
                  )}
                  
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => openEditForm(pkg)}
                        className="bg-white border border-gray-200 px-3 py-2 rounded-full text-sm font-semibold hover:bg-gray-50 transition-all"
                      >
                        <i className="fas fa-edit text-[#02a2e0]"></i>
                      </button>
                      <button 
                        onClick={() => handleToggleActive(pkg)}
                        className={`px-3 py-2 rounded-full text-sm font-semibold transition-all ${
                          pkg.isActive 
                            ? 'bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100' 
                            : 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        <i className={`fas ${pkg.isActive ? 'fa-pause' : 'fa-play'}`}></i>
                      </button>
                      <button 
                        onClick={() => handleDeletePackage(pkg)}
                        className="bg-white border border-red-200 text-red-600 px-3 py-2 rounded-full text-sm font-semibold hover:bg-red-50 transition-all"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================
          CREATE/EDIT PACKAGE MODAL (Admin Only)
          ============================================================ */}
      {showForm && isAdmin && (
        <Modal onClose={() => setShowForm(false)}>
          <div className="max-h-[80vh] overflow-y-auto max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-[#132149] mb-4">
              {selectedPackage ? '✏️ Edit Package' : '➕ Create New Package'}
            </h3>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                <i className="fas fa-exclamation-circle mr-1"></i> {saveError}
              </div>
            )}

            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Package Name *</label>
                  <input 
                    type="text" 
                    name="packageName" 
                    value={formData.packageName} 
                    onChange={handleChange} 
                    placeholder="Platinum Package"
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Price (ZAR) *</label>
                  <input 
                    type="number" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleChange} 
                    placeholder="25000"
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows="3"
                  placeholder="Describe what this package includes..."
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Golf Players</label>
                  <input 
                    type="number" 
                    name="golfPlayers" 
                    value={formData.golfPlayers} 
                    onChange={handleNumberChange}
                    min="0"
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Additional Guests</label>
                  <input 
                    type="number" 
                    name="additionalGuests" 
                    value={formData.additionalGuests} 
                    onChange={handleNumberChange}
                    min="0"
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
              </div>

              {/* Benefits */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Benefits & Inclusions</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      name="brandingCaps" 
                      checked={formData.brandingCaps} 
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                    />
                    <span className="text-sm">Branding Caps</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      name="brandingAllocatedHole" 
                      checked={formData.brandingAllocatedHole} 
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                    />
                    <span className="text-sm">Allocated Hole</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      name="brandingShirts" 
                      checked={formData.brandingShirts} 
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                    />
                    <span className="text-sm">Branding Shirts</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      name="meetAndGreet" 
                      checked={formData.meetAndGreet} 
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                    />
                    <span className="text-sm">Meet & Greet</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      name="golfKitMerchandise" 
                      checked={formData.golfKitMerchandise} 
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                    />
                    <span className="text-sm">Golf Kit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      name="prizeGivingAcknowledgement" 
                      checked={formData.prizeGivingAcknowledgement} 
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                    />
                    <span className="text-sm">Prize Giving</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      name="websiteAcknowledgement" 
                      checked={formData.websiteAcknowledgement} 
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                    />
                    <span className="text-sm">Website</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      name="seatWithANCLeadership" 
                      checked={formData.seatWithANCLeadership} 
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                    />
                    <span className="text-sm">ANC Leadership</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      name="seatWithCOSATULeadership" 
                      checked={formData.seatWithCOSATULeadership} 
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                    />
                    <span className="text-sm">COSATU Leadership</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      name="premiumBranding" 
                      checked={formData.premiumBranding} 
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                    />
                    <span className="text-sm">Premium Branding</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="isActive" 
                    checked={formData.isActive} 
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                  />
                  <span className="text-sm font-medium text-gray-600">Package is Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
              <button 
                onClick={handleSavePackage} 
                disabled={isSaving}
                className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
                ) : (
                  <><i className="fas fa-save"></i> {selectedPackage ? 'Update' : 'Create'} Package</>
                )}
              </button>
              <button 
                onClick={() => setShowForm(false)} 
                className="border border-gray-300 px-6 py-3 rounded-full font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================
          REQUEST PACKAGE MODAL (Sponsor Only)
          ============================================================ */}
      {showRequestModal && selectedPackage && (
        <Modal onClose={() => setShowRequestModal(false)}>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-[#132149] mb-4">
              <i className="fas fa-paper-plane text-[#02a2e0] mr-2"></i>
              Request Package
            </h3>
            
            <div className="bg-blue-50 rounded-2xl p-4 mb-4">
              <p className="text-sm font-semibold text-blue-800">{selectedPackage.packageName}</p>
              <p className="text-2xl font-bold text-[#02a2e0]">{formatCurrency(selectedPackage.price)}</p>
              <p className="text-sm text-blue-700 mt-1">{selectedPackage.description}</p>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 mb-1 block">Additional Notes (Optional)</label>
              <textarea
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                rows="3"
                placeholder="Any specific requirements or questions about this package..."
                className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRequestPackage}
                disabled={isSaving}
                className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Submitting...</>
                ) : (
                  <><i className="fas fa-paper-plane"></i> Submit Request</>
                )}
              </button>
              <button
                onClick={() => setShowRequestModal(false)}
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

export default SponsorPackages;