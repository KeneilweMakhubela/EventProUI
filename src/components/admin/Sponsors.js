import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../Modal';

const Sponsors = () => {
  const { apiCall } = useAuth();
  const [sponsors, setSponsors] = useState([]);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    active: 0,
    rejected: 0,
    suspended: 0,
  });

  // Form states
  const [formData, setFormData] = useState({
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
    registrationNumber: '',
    taxNumber: '',
    logoUrl: '',
    bannerUrl: '',
    status: 'Pending',
    preferredPackageId: null,
    contactPersons: [
      {
        fullName: '',
        email: '',
        phoneNumber: '',
        jobTitle: '',
        department: '',
        isPrimary: true,
      }
    ],
  });

  // ============================================================
  // FETCH DATA
  // ============================================================

  // Fetch all sponsors with pagination
  const fetchSponsors = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    
    try {
      const response = await apiCall('/api/Sponsor/admin/all?page=1&pageSize=100', 'GET');
      console.log('📥 Sponsors response:', response);
      
      if (response && response.items) {
        setSponsors(response.items);
        const items = response.items;
        setStats({
          total: items.length,
          pending: items.filter(s => s.status === 'Pending').length,
          approved: items.filter(s => s.status === 'Approved').length,
          active: items.filter(s => s.status === 'Active').length,
          rejected: items.filter(s => s.status === 'Rejected').length,
          suspended: items.filter(s => s.status === 'Suspended').length,
        });
      } else if (Array.isArray(response)) {
        setSponsors(response);
        setStats({
          total: response.length,
          pending: response.filter(s => s.status === 'Pending').length,
          approved: response.filter(s => s.status === 'Approved').length,
          active: response.filter(s => s.status === 'Active').length,
          rejected: response.filter(s => s.status === 'Rejected').length,
          suspended: response.filter(s => s.status === 'Suspended').length,
        });
      } else {
        setSponsors([]);
      }
    } catch (error) {
      console.error('❌ Error fetching sponsors:', error);
      setLoadError(error.message || 'Failed to load sponsors');
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  // Fetch sponsorship packages
  const fetchPackages = useCallback(async () => {
    try {
      const response = await apiCall('/api/Sponsor/packages', 'GET');
      console.log('📥 Packages response:', response);
      
      let packagesList = [];
      if (response && response.items) {
        packagesList = response.items;
      } else if (Array.isArray(response)) {
        packagesList = response;
      }
      
      // Map packages to ensure consistent benefits structure
      const mappedPackages = packagesList.map(pkg => ({
        ...pkg,
        benefits: {
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
        }
      }));
      
      setPackages(mappedPackages);
    } catch (error) {
      console.error('❌ Error fetching packages:', error);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchSponsors();
    fetchPackages();
  }, [fetchSponsors, fetchPackages]);

  // ============================================================
  // FILTER SPONSORS
  // ============================================================

  const filteredSponsors = sponsors.filter(s => {
    const matchesSearch = s.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.status?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || s.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const openSponsorForm = (sponsor = null) => {
    if (sponsor) {
      setSelectedSponsor(sponsor);
      setFormData({
        companyName: sponsor.companyName || '',
        email: sponsor.email || '',
        phoneNumber: sponsor.phoneNumber || '',
        website: sponsor.website || '',
        linkedIn: sponsor.linkedIn || '',
        twitter: sponsor.twitter || '',
        facebook: sponsor.facebook || '',
        streetAddress: sponsor.streetAddress || '',
        city: sponsor.city || '',
        province: sponsor.province || '',
        postalCode: sponsor.postalCode || '',
        country: sponsor.country || 'South Africa',
        industry: sponsor.industry || '',
        companySize: sponsor.companySize || '',
        registrationNumber: sponsor.registrationNumber || '',
        taxNumber: sponsor.taxNumber || '',
        logoUrl: sponsor.logoUrl || '',
        bannerUrl: sponsor.bannerUrl || '',
        status: sponsor.status || 'Pending',
        preferredPackageId: sponsor.packageAllocations?.find(a => a.status === 'Active')?.packageId || null,
        contactPersons: sponsor.contactPersons?.length > 0 
          ? sponsor.contactPersons.map(cp => ({
              fullName: cp.fullName || '',
              email: cp.email || '',
              phoneNumber: cp.phoneNumber || '',
              jobTitle: cp.jobTitle || '',
              department: cp.department || '',
              isPrimary: cp.isPrimary || false,
            }))
          : [{ fullName: '', email: '', phoneNumber: '', jobTitle: '', department: '', isPrimary: true }],
      });
    } else {
      setSelectedSponsor(null);
      setFormData({
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
        registrationNumber: '',
        taxNumber: '',
        logoUrl: '',
        bannerUrl: '',
        status: 'Pending',
        preferredPackageId: null,
        contactPersons: [{ fullName: '', email: '', phoneNumber: '', jobTitle: '', department: '', isPrimary: true }],
      });
    }
    setValidationErrors({});
    setSaveError('');
    setSaveSuccess('');
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleContactChange = (index, field, value) => {
    setFormData(prev => {
      const updatedContacts = [...prev.contactPersons];
      updatedContacts[index] = { ...updatedContacts[index], [field]: value };
      return { ...prev, contactPersons: updatedContacts };
    });
    const key = `contactPerson_${index}_${field}`;
    setValidationErrors(prev => ({ ...prev, [key]: '' }));
  };

  const addContactPerson = () => {
    setFormData(prev => ({
      ...prev,
      contactPersons: [
        ...prev.contactPersons,
        { fullName: '', email: '', phoneNumber: '', jobTitle: '', department: '', isPrimary: false }
      ]
    }));
  };

  const removeContactPerson = (index) => {
    if (formData.contactPersons.length <= 1) {
      setSaveError('At least one contact person is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      contactPersons: prev.contactPersons.filter((_, i) => i !== index)
    }));
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateSponsorForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    
    if (!formData.companyName || formData.companyName.trim().length < 2) {
      errors.companyName = 'Company name is required (min 2 characters)';
    }
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = 'Valid email is required';
    }
    if (!formData.phoneNumber || !phoneRegex.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Valid phone number is required (min 10 digits)';
    }
    
    formData.contactPersons.forEach((cp, index) => {
      if (!cp.fullName || cp.fullName.trim().length < 2) {
        errors[`contactPerson_${index}_fullName`] = 'Contact name is required';
      }
      if (!cp.email || !emailRegex.test(cp.email)) {
        errors[`contactPerson_${index}_email`] = 'Valid contact email is required';
      }
      if (!cp.phoneNumber || !phoneRegex.test(cp.phoneNumber)) {
        errors[`contactPerson_${index}_phoneNumber`] = 'Valid contact phone is required';
      }
    });
    
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

  const getContactFieldError = (index, field) => {
    const key = `contactPerson_${index}_${field}`;
    return validationErrors[key] || '';
  };

  // ============================================================
  // SAVE SPONSOR (CREATE/UPDATE)
  // ============================================================

  const handleSaveSponsor = async () => {
    if (!validateSponsorForm()) {
      setSaveError('Please fix the highlighted fields.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setValidationErrors({});

    const dataToSave = {
      companyName: formData.companyName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      website: formData.website?.trim() || null,
      linkedIn: formData.linkedIn?.trim() || null,
      twitter: formData.twitter?.trim() || null,
      facebook: formData.facebook?.trim() || null,
      streetAddress: formData.streetAddress?.trim() || null,
      city: formData.city?.trim() || null,
      province: formData.province?.trim() || null,
      postalCode: formData.postalCode?.trim() || null,
      country: formData.country || 'South Africa',
      industry: formData.industry?.trim() || null,
      companySize: formData.companySize?.trim() || null,
      registrationNumber: formData.registrationNumber?.trim() || null,
      taxNumber: formData.taxNumber?.trim() || null,
      logoUrl: formData.logoUrl?.trim() || null,
      bannerUrl: formData.bannerUrl?.trim() || null,
      preferredPackageId: formData.preferredPackageId || null,
      contactPersons: formData.contactPersons.map(cp => ({
        fullName: cp.fullName.trim(),
        email: cp.email.trim(),
        phoneNumber: cp.phoneNumber.trim(),
        jobTitle: cp.jobTitle?.trim() || null,
        department: cp.department?.trim() || null,
        isPrimary: cp.isPrimary || false,
      })),
    };

    // Add status for updates
    if (selectedSponsor) {
      dataToSave.status = formData.status;
    }

    try {
      let response;
      if (selectedSponsor) {
        // UPDATE - using admin update endpoint
        response = await apiCall(`/api/Sponsor/admin/update/${selectedSponsor.sponsorId}`, 'PUT', dataToSave);
        setSaveSuccess('Sponsor updated successfully!');
      } else {
        // CREATE - using admin create endpoint
        response = await apiCall('/api/Sponsor/admin/create', 'POST', dataToSave);
        setSaveSuccess('Sponsor created successfully!');
      }

      await fetchSponsors();
      setTimeout(() => { setShowForm(false); setSaveSuccess(''); }, 1500);
    } catch (error) {
      console.error('❌ Error saving sponsor:', error);
      if (error.details) {
        setValidationErrors(error.details);
        setSaveError('Please fix the highlighted fields.');
      } else {
        setSaveError(error.message || 'Failed to save sponsor.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // ADMIN ACTIONS
  // ============================================================

  // Approve sponsor with optional package assignment
const handleApprove = async (sponsor, packageId = 0) => {
  if (!sponsor || !sponsor.sponsorId) {
    setSaveError('Invalid sponsor data');
    return;
  }

  setIsSaving(true);
  setSaveError('');
  
  try {
    // Build the approval payload matching the backend DTO
    const payload = {
      approve: true,
      rejectionReason: "string", // Send as literal "string" for approval as per your backend spec
      packageId: packageId || 0,
      notes: approvalNotes?.trim() || `Approved by admin${packageId ? ' with package ID: ' + packageId : ''}`,
    };

    console.log('📤 Approving sponsor ID:', sponsor.sponsorId);
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));

    const response = await apiCall(
      `/api/Sponsor/admin/approve/${sponsor.sponsorId}`, 
      'POST', 
      payload
    );
    
    console.log('✅ Approval response:', response);
    
    setSaveSuccess(`✅ "${sponsor.companyName}" approved successfully!`);
    setShowApproveModal(false);
    setSelectedSponsor(null);
    setApprovalNotes('');
    setSelectedPackage(null);
    await fetchSponsors();
    setTimeout(() => setSaveSuccess(''), 3000);
    
  } catch (error) {
    console.error('❌ Error approving sponsor:', error);
    console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    
    let errorMessage = 'Failed to approve sponsor.';
    
    // Handle validation errors
    if (error.errors) {
      // Flatten validation errors
      const errorMessages = [];
      Object.entries(error.errors).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          errorMessages.push(`${field}: ${messages.join(', ')}`);
        } else {
          errorMessages.push(`${field}: ${messages}`);
        }
      });
      errorMessage = errorMessages.join('\n');
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.error) {
      errorMessage = error.error;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Check if error has a response with details
    if (error.response) {
      console.error('❌ Response:', error.response);
      if (error.response.data) {
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
      }
    }
    
    setSaveError(`❌ ${errorMessage}`);
    setTimeout(() => setSaveError(''), 8000);
  } finally {
    setIsSaving(false);
  }
};

  // Reject sponsor with reason
const handleReject = async (sponsor) => {
  if (!sponsor || !sponsor.sponsorId) {
    setSaveError('Invalid sponsor data');
    return;
  }
  
  if (!window.confirm(`Reject "${sponsor.companyName}"? This action cannot be undone.`)) return;
  
  setIsSaving(true);
  setSaveError('');
  
  try {
    const reason = window.prompt('Please provide a reason for rejection (optional):');
    
    // Build rejection payload matching the backend DTO
    const payload = {
      approve: false,
      rejectionReason: reason?.trim() || 'Rejected by admin',
      packageId: 0,
      notes: "string", // Send as literal "string" as per your backend spec
    };

    console.log('📤 Rejecting sponsor ID:', sponsor.sponsorId);
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));

    const response = await apiCall(
      `/api/Sponsor/admin/approve/${sponsor.sponsorId}`, 
      'POST', 
      payload
    );
    
    console.log('✅ Rejection response:', response);
    
    setSaveSuccess(`✅ "${sponsor.companyName}" has been rejected.`);
    await fetchSponsors();
    setTimeout(() => setSaveSuccess(''), 3000);
    
  } catch (error) {
    console.error('❌ Error rejecting sponsor:', error);
    console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    
    let errorMessage = 'Failed to reject sponsor.';
    
    // Handle validation errors
    if (error.errors) {
      const errorMessages = [];
      Object.entries(error.errors).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          errorMessages.push(`${field}: ${messages.join(', ')}`);
        } else {
          errorMessages.push(`${field}: ${messages}`);
        }
      });
      errorMessage = errorMessages.join('\n');
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.error) {
      errorMessage = error.error;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Check if error has a response with details
    if (error.response) {
      console.error('❌ Response:', error.response);
      if (error.response.data) {
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
      }
    }
    
    setSaveError(`❌ ${errorMessage}`);
    setTimeout(() => setSaveError(''), 8000);
  } finally {
    setIsSaving(false);
  }
};

  // Toggle sponsor status (Active/Suspended) - matches UpdateSponsorStatusDto
      // Toggle sponsor status (Active/Approved <-> Suspended)
    const handleToggleStatus = async (sponsor) => {
      console.log('🔄 Toggling status for sponsor:', sponsor.companyName, 'Current status:', sponsor.status);
      
      let newStatus;
      
      if (sponsor.status === 'Active') {
        newStatus = 'Suspended';
      } else if (sponsor.status === 'Suspended') {
        newStatus = 'Approved'; // Change to Approved when activating from Suspended
      } else if (sponsor.status === 'Approved') {
        newStatus = 'Suspended';
      } else {
        console.warn('⚠️ Unknown status for toggle:', sponsor.status);
        return;
      }
      
      const actionText = (newStatus === 'Active' || newStatus === 'Approved') ? 'activate' : 'suspend';
      
      if (!window.confirm(`Are you sure you want to ${actionText} "${sponsor.companyName}"?`)) {
        return;
      }
      
      try {
        const payload = {
          status: newStatus,
          rejectionReason: "" // Required field - empty string for non-rejection status changes
        };
        
        console.log('📤 Updating status to:', newStatus, 'Endpoint: /api/Sponsor/admin/status/' + sponsor.sponsorId);
        console.log('📤 Payload:', JSON.stringify(payload));
        
        const response = await apiCall(`/api/Sponsor/admin/status/${sponsor.sponsorId}`, 'PUT', payload);
        
        console.log('✅ Status update response:', response);
        
        setSaveSuccess(`✅ Sponsor status changed to ${newStatus.toLowerCase()} successfully!`);
        await fetchSponsors();
        setTimeout(() => setSaveSuccess(''), 3000);
      } catch (error) {
        console.error('❌ Error toggling status:', error);
        console.error('❌ Full error details:', JSON.stringify(error, null, 2));
        
        let errorMessage = 'Failed to update status.';
        
        // Handle validation errors
        if (error.errors) {
          const errorMessages = [];
          Object.entries(error.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${messages}`);
            }
          });
          errorMessage = errorMessages.join('\n');
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        // Check if error has a response with details
        if (error.response) {
          console.error('❌ Response:', error.response);
          if (error.response.data) {
            errorMessage = error.response.data.message || error.response.data.error || errorMessage;
          }
        }
        
        setSaveError(`❌ ${errorMessage}`);
        setTimeout(() => setSaveError(''), 8000);
      }
    };

  // Delete (deactivate) sponsor
  const handleDelete = async (sponsor) => {
    if (!window.confirm(`Are you sure you want to delete "${sponsor.companyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiCall(`/api/Sponsor/admin/delete/${sponsor.sponsorId}`, 'DELETE');
      setSaveSuccess(`"${sponsor.companyName}" has been deleted.`);
      await fetchSponsors();
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error deleting sponsor:', error);
      setSaveError(`Failed to delete: ${error.message}`);
      setTimeout(() => setSaveError(''), 3000);
    }
  };

  // ============================================================
  // UI HELPERS
  // ============================================================

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTier = (sponsor) => {
    const packageAllocations = sponsor.packageAllocations || [];
    const activeAllocation = packageAllocations.find(a => a.status === 'Active');
    
    if (activeAllocation && activeAllocation.packagePrice) {
      if (activeAllocation.packagePrice >= 25000) return { tier: 'Platinum', color: 'from-gray-200 to-gray-300 text-gray-700' };
      if (activeAllocation.packagePrice >= 10000) return { tier: 'Gold', color: 'from-yellow-100 to-yellow-200 text-yellow-800' };
      return { tier: 'Silver', color: 'from-blue-100 to-blue-200 text-blue-800' };
    }
    
    const size = sponsor.companySize?.toLowerCase() || '';
    if (size === 'enterprise' || size === 'large') return { tier: 'Platinum', color: 'from-gray-200 to-gray-300 text-gray-700' };
    if (size === 'medium') return { tier: 'Gold', color: 'from-yellow-100 to-yellow-200 text-yellow-800' };
    return { tier: 'Silver', color: 'from-blue-100 to-blue-200 text-blue-800' };
  };

  const getPackageName = (sponsor) => {
    const packageAllocations = sponsor.packageAllocations || [];
    const activeAllocation = packageAllocations.find(a => a.status === 'Active');
    return activeAllocation ? activeAllocation.packageName : null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading sponsors...</p>
        </div>
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
          <button onClick={fetchSponsors} className="text-red-500 hover:text-red-700">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-star text-[#02a2e0]"></i> Sponsor Management
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-blue-50 rounded-2xl p-3 text-center">
          <div className="text-xl font-bold text-[#132149]">{stats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-3 text-center">
          <div className="text-xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-3 text-center">
          <div className="text-xl font-bold text-green-700">{stats.approved}</div>
          <div className="text-xs text-gray-500">Approved</div>
        </div>
        <div className="bg-purple-50 rounded-2xl p-3 text-center">
          <div className="text-xl font-bold text-purple-700">{stats.active}</div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
        <div className="bg-red-50 rounded-2xl p-3 text-center">
          <div className="text-xl font-bold text-red-700">{stats.rejected}</div>
          <div className="text-xs text-gray-500">Rejected</div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-3 text-center">
          <div className="text-xl font-bold text-gray-700">{stats.suspended}</div>
          <div className="text-xs text-gray-500">Suspended</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card-gradient rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Search sponsors..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" 
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <button onClick={() => openSponsorForm()} className="btn-primary-gradient text-white px-5 py-3 rounded-full text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
            <i className="fas fa-plus"></i> Add Sponsor
          </button>
          <button onClick={fetchSponsors} className="border border-gray-300 text-gray-600 px-4 py-3 rounded-full text-sm font-semibold flex items-center gap-2">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Sponsors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filteredSponsors.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-gray-50 rounded-3xl">
            <i className="fas fa-building text-5xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">No sponsors found</p>
          </div>
        ) : (
          filteredSponsors.map(s => {
            const tierInfo = getTier(s);
            const packageName = getPackageName(s);
            return (
              <div key={s.sponsorId} className="card-gradient rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#02a2e0] to-[#00a5df] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt={s.companyName} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        s.companyName?.charAt(0).toUpperCase() || 'S'
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#132149] text-sm truncate max-w-[120px]">{s.companyName}</h4>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(s.status)}`}>
                        {s.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${tierInfo.color}`}>
                    {tierInfo.tier}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-500">
                  <p className="truncate"><i className="fas fa-envelope w-4"></i> {s.email}</p>
                  <p><i className="fas fa-phone w-4"></i> {s.phoneNumber}</p>
                  {packageName && (
                    <p className="text-xs text-[#02a2e0]"><i className="fas fa-gift w-4"></i> {packageName}</p>
                  )}
                  {s.createdDate && (
                    <p className="text-xs text-gray-400"><i className="fas fa-clock w-4"></i> {formatDate(s.createdDate)}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => { setSelectedSponsor(s); setShowView(true); }} className="bg-white border border-gray-200 px-2.5 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-50 transition-all">
                    <i className="fas fa-eye"></i>
                  </button>
                  <button onClick={() => openSponsorForm(s)} className="bg-white border border-gray-200 px-2.5 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-50 transition-all">
                    <i className="fas fa-edit"></i>
                  </button>
                  
                  {/* Replace the status buttons section in the sponsor cards with this: */}

                    {/* Approve/Reject buttons for Pending sponsors */}
                                      {/* Approve/Reject buttons for Pending sponsors */}
                  {s.status === 'Pending' && (
                    <>
                      <button 
                        onClick={() => { setSelectedSponsor(s); setShowApproveModal(true); }} 
                        className="bg-green-50 border border-green-200 text-green-700 px-2.5 py-1.5 rounded-full text-xs font-semibold hover:bg-green-100 transition-all"
                      >
                        <i className="fas fa-check"></i> Approve
                      </button>
                      <button onClick={() => handleReject(s)} className="bg-red-50 border border-red-200 text-red-700 px-2.5 py-1.5 rounded-full text-xs font-semibold hover:bg-red-100 transition-all">
                        <i className="fas fa-times"></i> Reject
                      </button>
                    </>
                  )}

                  {/* Suspend button for Approved sponsors */}
                  {s.status === 'Approved' && (
                    <button onClick={() => handleToggleStatus(s)} className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-2.5 py-1.5 rounded-full text-xs font-semibold hover:bg-yellow-100 transition-all">
                      <i className="fas fa-pause"></i> Suspend
                    </button>
                  )}

                  {/* Suspend button for Active sponsors */}
                  {s.status === 'Active' && (
                    <button onClick={() => handleToggleStatus(s)} className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-2.5 py-1.5 rounded-full text-xs font-semibold hover:bg-yellow-100 transition-all">
                      <i className="fas fa-pause"></i> Suspend
                    </button>
                  )}

                  {/* Activate button for Suspended sponsors */}
                  {s.status === 'Suspended' && (
                    <button onClick={() => handleToggleStatus(s)} className="bg-green-50 border border-green-200 text-green-700 px-2.5 py-1.5 rounded-full text-xs font-semibold hover:bg-green-100 transition-all">
                      <i className="fas fa-play"></i> Activate
                    </button>
                  )}

                  {/* Delete button always visible */}
                  <button onClick={() => handleDelete(s)} className="bg-white border border-red-200 text-red-600 px-2.5 py-1.5 rounded-full text-xs font-semibold hover:bg-red-50 transition-all">
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================
          VIEW SPONSOR MODAL
          ============================================================ */}
      {showView && selectedSponsor && (
        <Modal onClose={() => setShowView(false)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#02a2e0] to-[#00a5df] flex items-center justify-center text-white text-3xl font-bold mx-auto">
                {selectedSponsor.logoUrl ? (
                  <img src={selectedSponsor.logoUrl} alt={selectedSponsor.companyName} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  selectedSponsor.companyName?.charAt(0).toUpperCase() || 'S'
                )}
              </div>
              <h2 className="text-2xl font-bold text-[#132149] mt-2">{selectedSponsor.companyName}</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedSponsor.status)}`}>
                  {selectedSponsor.status || 'Pending'}
                </span>
                {getPackageName(selectedSponsor) && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {getPackageName(selectedSponsor)}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-400 block text-xs">Email</span>
                <span className="font-semibold">{selectedSponsor.email}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-400 block text-xs">Phone</span>
                <span className="font-semibold">{selectedSponsor.phoneNumber}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-400 block text-xs">Industry</span>
                <span className="font-semibold">{selectedSponsor.industry || 'N/A'}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-400 block text-xs">Company Size</span>
                <span className="font-semibold">{selectedSponsor.companySize || 'N/A'}</span>
              </div>
              {selectedSponsor.website && (
                <div className="bg-gray-50 p-3 rounded-xl col-span-2">
                  <span className="text-gray-400 block text-xs">Website</span>
                  <a href={selectedSponsor.website} target="_blank" rel="noopener noreferrer" className="text-[#02a2e0] hover:underline">
                    {selectedSponsor.website}
                  </a>
                </div>
              )}
              {selectedSponsor.streetAddress && (
                <div className="bg-gray-50 p-3 rounded-xl col-span-2">
                  <span className="text-gray-400 block text-xs">Address</span>
                  <p className="font-semibold">{selectedSponsor.streetAddress}</p>
                  <p className="text-sm text-gray-500">{selectedSponsor.city}{selectedSponsor.province ? `, ${selectedSponsor.province}` : ''} {selectedSponsor.postalCode}</p>
                  <p className="text-sm text-gray-500">{selectedSponsor.country || 'South Africa'}</p>
                </div>
              )}
            </div>

            {selectedSponsor.contactPersons && selectedSponsor.contactPersons.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold text-[#132149] mb-2">Contact Persons</h5>
                {selectedSponsor.contactPersons.map((cp, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-xl mb-2">
                    <p className="font-semibold">{cp.fullName} {cp.isPrimary && <span className="text-xs text-green-600">(Primary)</span>}</p>
                    <p className="text-sm text-gray-500">{cp.email} • {cp.phoneNumber}</p>
                    {cp.jobTitle && <p className="text-sm text-gray-400">{cp.jobTitle}{cp.department ? ` • ${cp.department}` : ''}</p>}
                  </div>
                ))}
              </div>
            )}

            {selectedSponsor.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 rounded-2xl border border-red-200">
                <p className="text-xs text-red-500 font-medium">Rejection Reason</p>
                <p className="text-sm text-red-700">{selectedSponsor.rejectionReason}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {selectedSponsor.status === 'Pending' && (
                <>
                  <button 
                    onClick={() => { setShowView(false); setSelectedSponsor(selectedSponsor); setShowApproveModal(true); }} 
                    className="flex-1 bg-green-500 text-white px-4 py-3 rounded-full font-semibold text-sm hover:bg-green-600 transition-all"
                  >
                    <i className="fas fa-check mr-1"></i> Approve
                  </button>
                  <button onClick={() => { setShowView(false); handleReject(selectedSponsor); }} className="flex-1 bg-red-500 text-white px-4 py-3 rounded-full font-semibold text-sm hover:bg-red-600 transition-all">
                    <i className="fas fa-times mr-1"></i> Reject
                  </button>
                </>
              )}
              <button onClick={() => { setShowView(false); openSponsorForm(selectedSponsor); }} className="flex-1 btn-primary-gradient text-white px-4 py-3 rounded-full font-semibold text-sm">
                <i className="fas fa-edit mr-1"></i> Edit
              </button>
              <button onClick={() => setShowView(false)} className="flex-1 border border-gray-300 px-4 py-3 rounded-full font-semibold text-sm">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================
          APPROVE SPONSOR MODAL
          ============================================================ */}
      {showApproveModal && selectedSponsor && (
        <Modal onClose={() => { setShowApproveModal(false); setSelectedSponsor(null); setSelectedPackage(null); setApprovalNotes(''); }}>
          <div className="max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#132149] mb-4">
              <i className="fas fa-check-circle text-[#02a2e0] mr-2"></i>
              Approve Sponsor - {selectedSponsor.companyName}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Select a sponsorship package to assign to this sponsor. You can also approve without a package.
            </p>

            <div className="space-y-3 mb-4">
              <button
                onClick={() => handleApprove(selectedSponsor, 0)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 hover:border-[#02a2e0] transition-all"
              >
                <div>
                  <h4 className="font-semibold text-[#132149]">No Package</h4>
                  <p className="text-sm text-gray-400">Approve without assigning a package</p>
                </div>
                <span className="text-gray-400"><i className="fas fa-chevron-right"></i></span>
              </button>

              {packages.filter(p => p.isActive).map(pkg => (
                <button
                  key={pkg.packageId}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                    selectedPackage?.packageId === pkg.packageId
                      ? 'border-[#02a2e0] bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-[#02a2e0]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[#132149]">{pkg.packageName}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        R{Number(pkg.price).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{pkg.golfPlayers + pkg.additionalGuests} pax</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pkg.benefits?.brandingCaps && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Caps</span>}
                      {pkg.benefits?.brandingShirts && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Shirts</span>}
                      {pkg.benefits?.premiumBranding && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Premium</span>}
                      {pkg.benefits?.meetAndGreet && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Meet & Greet</span>}
                    </div>
                  </div>
                  {selectedPackage?.packageId === pkg.packageId && (
                    <span className="text-[#02a2e0]"><i className="fas fa-check-circle"></i></span>
                  )}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 mb-1 block">Approval Notes (Optional)</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows="2"
                placeholder="Add any notes about this approval..."
                className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(selectedSponsor, selectedPackage?.packageId || 0)}
                disabled={isSaving}
                className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold disabled:opacity-50"
              >
                {isSaving ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Approving...</>
                ) : (
                  <><i className="fas fa-check mr-1"></i> Approve Sponsor</>
                )}
              </button>
              <button 
                onClick={() => { setShowApproveModal(false); setSelectedSponsor(null); setSelectedPackage(null); setApprovalNotes(''); }} 
                className="border border-gray-300 px-6 py-3 rounded-full font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================
          CREATE/EDIT SPONSOR FORM MODAL
          ============================================================ */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <div className="max-h-[80vh] overflow-y-auto max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-[#132149] mb-4">
              {selectedSponsor ? 'Edit Sponsor' : 'Add New Sponsor'}
            </h3>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                <i className="fas fa-exclamation-circle mr-1"></i> {saveError}
              </div>
            )}

            {Object.keys(validationErrors).length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-2xl text-sm">
                <p className="font-semibold text-yellow-800">Please fix the following:</p>
                <ul className="mt-1 space-y-1 list-disc pl-4">
                  {Object.entries(validationErrors).map(([field, errors]) => {
                    const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
                    const errorMsg = Array.isArray(errors) ? errors.join(', ') : errors;
                    return <li key={field} className="text-yellow-700"><span className="font-medium">{fieldName}:</span> {errorMsg}</li>;
                  })}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Company Name *</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="ABC Tech Solutions" className={`w-full p-3 rounded-2xl border-2 ${getFieldError('companyName') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} />
                  {getFieldError('companyName') && <p className="mt-1 text-xs text-red-500">{getFieldError('companyName')}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="info@abctech.com" className={`w-full p-3 rounded-2xl border-2 ${getFieldError('email') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} />
                  {getFieldError('email') && <p className="mt-1 text-xs text-red-500">{getFieldError('email')}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Phone *</label>
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+27721234567" className={`w-full p-3 rounded-2xl border-2 ${getFieldError('phoneNumber') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} />
                  {getFieldError('phoneNumber') && <p className="mt-1 text-xs text-red-500">{getFieldError('phoneNumber')}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Industry</label>
                  <input type="text" name="industry" value={formData.industry} onChange={handleChange} placeholder="Technology" className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Street Address</label>
                <input type="text" name="streetAddress" value={formData.streetAddress} onChange={handleChange} placeholder="123 Tech Park" className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Johannesburg" className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Province</label>
                  <input type="text" name="province" value={formData.province} onChange={handleChange} placeholder="Gauteng" className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Postal Code</label>
                  <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="2196" className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Country</label>
                  <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="South Africa" className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Logo URL</label>
                  <input type="url" name="logoUrl" value={formData.logoUrl} onChange={handleChange} placeholder="https://example.com/logo.png" className={`w-full p-3 rounded-2xl border-2 ${getFieldError('logoUrl') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} />
                  {getFieldError('logoUrl') && <p className="mt-1 text-xs text-red-500">{getFieldError('logoUrl')}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Banner URL</label>
                  <input type="url" name="bannerUrl" value={formData.bannerUrl} onChange={handleChange} placeholder="https://example.com/banner.png" className={`w-full p-3 rounded-2xl border-2 ${getFieldError('bannerUrl') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} />
                  {getFieldError('bannerUrl') && <p className="mt-1 text-xs text-red-500">{getFieldError('bannerUrl')}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Website</label>
                  <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://abctech.com" className={`w-full p-3 rounded-2xl border-2 ${getFieldError('website') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} />
                  {getFieldError('website') && <p className="mt-1 text-xs text-red-500">{getFieldError('website')}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">LinkedIn</label>
                  <input type="url" name="linkedIn" value={formData.linkedIn} onChange={handleChange} placeholder="https://linkedin.com/company/abc" className={`w-full p-3 rounded-2xl border-2 ${getFieldError('linkedIn') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} />
                  {getFieldError('linkedIn') && <p className="mt-1 text-xs text-red-500">{getFieldError('linkedIn')}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Twitter</label>
                  <input type="url" name="twitter" value={formData.twitter} onChange={handleChange} placeholder="https://twitter.com/abctech" className={`w-full p-3 rounded-2xl border-2 ${getFieldError('twitter') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`} />
                  {getFieldError('twitter') && <p className="mt-1 text-xs text-red-500">{getFieldError('twitter')}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Company Size</label>
                  <select name="companySize" value={formData.companySize} onChange={handleChange} className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none">
                    <option value="">Select Size</option>
                    <option value="Small">Small (1-50)</option>
                    <option value="Medium">Medium (51-200)</option>
                    <option value="Large">Large (201-1000)</option>
                    <option value="Enterprise">Enterprise (1000+)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Registration Number</label>
                  <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} placeholder="2023/123456/07" className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none" />
                </div>
              </div>

              {/* Package Selection */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Sponsorship Package</label>
                <select
                  name="preferredPackageId"
                  value={formData.preferredPackageId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      preferredPackageId: val ? parseInt(val) : null,
                    }));
                  }}
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                >
                  <option value="">No Package</option>
                  {packages.filter(p => p.isActive).map(pkg => (
                    <option key={pkg.packageId} value={pkg.packageId}>
                      {pkg.packageName} - R{Number(pkg.price).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Persons */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-600">Contact Persons</label>
                  <button type="button" onClick={addContactPerson} className="text-sm text-[#02a2e0] hover:text-[#0284c7] font-medium flex items-center gap-1">
                    <i className="fas fa-plus"></i> Add Contact
                  </button>
                </div>
                {formData.contactPersons.map((contact, index) => (
                  <div key={index} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-3">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="text-sm font-medium text-gray-700">Contact #{index + 1}</h5>
                      <button type="button" onClick={() => removeContactPerson(index)} className="text-red-400 hover:text-red-600">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                        <input type="text" value={contact.fullName} onChange={(e) => handleContactChange(index, 'fullName', e.target.value)} placeholder="John Doe" className={`w-full px-3 py-2 rounded-xl border-2 ${getContactFieldError(index, 'fullName') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} focus:border-[#02a2e0] outline-none text-sm`} />
                        {getContactFieldError(index, 'fullName') && <p className="mt-1 text-xs text-red-500">{getContactFieldError(index, 'fullName')}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                        <input type="email" value={contact.email} onChange={(e) => handleContactChange(index, 'email', e.target.value)} placeholder="john@abctech.com" className={`w-full px-3 py-2 rounded-xl border-2 ${getContactFieldError(index, 'email') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} focus:border-[#02a2e0] outline-none text-sm`} />
                        {getContactFieldError(index, 'email') && <p className="mt-1 text-xs text-red-500">{getContactFieldError(index, 'email')}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                        <input type="tel" value={contact.phoneNumber} onChange={(e) => handleContactChange(index, 'phoneNumber', e.target.value)} placeholder="+27721234567" className={`w-full px-3 py-2 rounded-xl border-2 ${getContactFieldError(index, 'phoneNumber') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} focus:border-[#02a2e0] outline-none text-sm`} />
                        {getContactFieldError(index, 'phoneNumber') && <p className="mt-1 text-xs text-red-500">{getContactFieldError(index, 'phoneNumber')}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
                        <input type="text" value={contact.jobTitle} onChange={(e) => handleContactChange(index, 'jobTitle', e.target.value)} placeholder="CEO" className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                        <input type="text" value={contact.department} onChange={(e) => handleContactChange(index, 'department', e.target.value)} placeholder="Executive" className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none text-sm" />
                      </div>
                      <div className="flex items-center mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={contact.isPrimary} onChange={(e) => handleContactChange(index, 'isPrimary', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]" />
                          <span className="text-sm text-gray-700">Primary</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveSponsor} disabled={isSaving} className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {isSaving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</> : <><i className="fas fa-save"></i> {selectedSponsor ? 'Update' : 'Add'} Sponsor</>}
              </button>
              <button onClick={() => setShowForm(false)} className="border border-gray-300 px-6 py-3 rounded-full font-semibold">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Sponsors;