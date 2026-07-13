import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SponsorApplication = () => {
  const { apiCall } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [step, setStep] = useState(1);
  const [packages, setPackages] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phoneNumber: '',
    website: '',
    streetAddress: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    industry: '',
    companySize: '',
    registrationNumber: '',
    taxNumber: '',
    preferredPackageId: '',
    eventId: '',
    notes: '',
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
  // FETCH PACKAGES AND EVENTS FROM DATABASE
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      // Fetch packages
      setPackagesLoading(true);
      try {
        console.log('📡 Fetching sponsorship packages from database...');
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
        console.log(`✅ Loaded ${packagesData.length} packages from database`);
      } catch (error) {
        console.error('❌ Error fetching packages:', error);
      } finally {
        setPackagesLoading(false);
      }

      // Fetch upcoming events using the dedicated endpoint
      setEventsLoading(true);
      try {
        console.log('📡 Fetching upcoming events from database...');
        const response = await apiCall('/api/Events/upcoming', 'GET');
        console.log('📥 Events response:', response);
        
        let eventsData = [];
        if (Array.isArray(response)) {
          eventsData = response;
        } else if (response && response.items) {
          eventsData = response.items;
        } else if (response && response.data) {
          eventsData = response.data;
        }
        
        // Sort events by start date (earliest first)
        const sortedEvents = eventsData.sort((a, b) => {
          const dateA = new Date(a.startDateTime);
          const dateB = new Date(b.startDateTime);
          return dateA - dateB;
        });
        
        setEvents(sortedEvents);
        console.log(`✅ Loaded ${sortedEvents.length} upcoming events from database`);
      } catch (error) {
        console.error('❌ Error fetching events:', error);
        setSaveError('Failed to load upcoming events. Please refresh the page and try again.');
        setTimeout(() => setSaveError(''), 5000);
      } finally {
        setEventsLoading(false);
      }
    };
    
    fetchData();
  }, [apiCall]);

  // ============================================================
  // FORM VALIDATION
  // ============================================================
  const validateForm = () => {
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
    if (!formData.industry || formData.industry.trim().length < 2) {
      errors.industry = 'Industry is required';
    }
    if (!formData.companySize) {
      errors.companySize = 'Company size is required';
    }
    if (!formData.eventId) {
      errors.eventId = 'Please select an event to sponsor';
    }
    
    // Validate contact persons
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

  // ============================================================
  // FORM HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
    
    // Update selected event details when event changes
    if (name === 'eventId' && value) {
      const event = events.find(e => e.id === parseInt(value));
      setSelectedEventDetails(event || null);
    } else if (name === 'eventId' && !value) {
      setSelectedEventDetails(null);
    }
  };

  const handleContactChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.contactPersons];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, contactPersons: updated };
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
  // SUBMIT APPLICATION
  // ============================================================
  const handleSubmit = async () => {
    // Clear previous errors
    setSaveError('');
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      setSaveError('Please fix the highlighted fields.');
      // Scroll to the first error
      const firstError = document.querySelector('.border-red-300');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsLoading(true);

    // Build the data to send - ensure all fields match the backend DTO
    const dataToSave = {
      companyName: formData.companyName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      website: formData.website?.trim() || null,
      streetAddress: formData.streetAddress?.trim() || null,
      city: formData.city?.trim() || null,
      province: formData.province?.trim() || null,
      postalCode: formData.postalCode?.trim() || null,
      country: formData.country || 'South Africa',
      industry: formData.industry?.trim() || '',
      companySize: formData.companySize?.trim() || '',
      registrationNumber: formData.registrationNumber?.trim() || null,
      taxNumber: formData.taxNumber?.trim() || null,
      preferredPackageId: formData.preferredPackageId ? parseInt(formData.preferredPackageId) : null,
      eventId: formData.eventId ? parseInt(formData.eventId) : null,
      notes: formData.notes?.trim() || null,
      contactPersons: formData.contactPersons.map(cp => ({
        fullName: cp.fullName.trim(),
        email: cp.email.trim(),
        phoneNumber: cp.phoneNumber.trim(),
        jobTitle: cp.jobTitle?.trim() || null,
        department: cp.department?.trim() || null,
        isPrimary: cp.isPrimary || false,
      })),
    };

    console.log('📤 Submitting sponsor application:', JSON.stringify(dataToSave, null, 2));

    try {
      const response = await apiCall('/api/Sponsor/apply', 'POST', dataToSave);
      console.log('✅ Application submitted:', response);
      setSaveSuccess('🎉 Sponsorship application submitted successfully! Our team will review your application and contact you soon.');
      setStep(2);
      setTimeout(() => setSaveSuccess(''), 8000);
    } catch (error) {
      console.error('❌ Error submitting application:', error);
      
      // Handle validation errors from backend
      if (error.errors) {
        // If backend returns validation errors as an object
        const backendErrors = error.errors;
        const formattedErrors = {};
        Object.keys(backendErrors).forEach(key => {
          // Map backend field names to frontend field names if needed
          const fieldMap = {
            'preferredPackageId': 'preferredPackageId',
            'contactPersons': 'contactPersons'
          };
          const frontendKey = fieldMap[key] || key;
          formattedErrors[frontendKey] = Array.isArray(backendErrors[key]) 
            ? backendErrors[key].join(', ') 
            : backendErrors[key];
        });
        setValidationErrors(formattedErrors);
        setSaveError('Please fix the highlighted fields.');
      } else if (error.details) {
        // Handle nested validation errors
        setValidationErrors(error.details);
        setSaveError('Please fix the highlighted fields.');
      } else if (error.message) {
        // Handle simple error message
        setSaveError(error.message);
      } else {
        setSaveError('Failed to submit application. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // UI HELPERS
  // ============================================================
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

  const formatCurrency = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Draft': 'bg-gray-100 text-gray-600',
      'Published': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700',
      'Completed': 'bg-blue-100 text-blue-700'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-600';
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-gradient rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-3xl text-green-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-[#132149] mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-4">{saveSuccess}</p>
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm text-blue-700">
              <i className="fas fa-info-circle mr-2"></i>
              What happens next?
            </p>
            <ul className="text-sm text-blue-600 mt-2 space-y-1">
              <li>• Our team will review your application within 2-3 business days</li>
              <li>• You'll receive a confirmation email with next steps</li>
              <li>• If approved, you'll get access to sponsor benefits</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="mt-4 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-star text-[#02a2e0]"></i> Sponsorship
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step === 1 ? 'bg-[#02a2e0] text-white' : 'bg-green-500 text-white'
          }`}>
            {step === 1 ? '1' : <i className="fas fa-check"></i>}
          </div>
          <span className={`font-semibold ${step === 1 ? 'text-[#132149]' : 'text-gray-500'}`}>
            Company Details
          </span>
        </div>
        <div className={`flex-1 h-0.5 mx-2 ${step === 1 ? 'bg-gray-300' : 'bg-green-500'}`}></div>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step === 2 ? 'bg-[#02a2e0] text-white' : 'bg-gray-300 text-gray-500'
          }`}>
            2
          </div>
          <span className={step === 2 ? 'font-semibold text-[#132149]' : 'text-gray-400'}>
            Contact Persons
          </span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-bold">
            3
          </div>
          <span className="text-gray-400">Submit</span>
        </div>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 flex items-start gap-3">
          <i className="fas fa-check-circle text-green-500 mt-1"></i>
          <div>{saveSuccess}</div>
        </div>
      )}
      {saveError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start gap-3">
          <i className="fas fa-exclamation-circle text-red-500 mt-1"></i>
          <div>{saveError}</div>
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

      <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100">
        {/* Company Information */}
        <h3 className="text-lg font-semibold text-[#132149] mb-4">🏢 Company Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="ABC Tech Solutions"
              className={`w-full p-3 rounded-2xl border-2 ${
                getFieldError('companyName') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              } focus:border-[#02a2e0] outline-none transition-colors`}
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
              value={formData.email}
              onChange={handleChange}
              placeholder="info@abctech.com"
              className={`w-full p-3 rounded-2xl border-2 ${
                getFieldError('email') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              } focus:border-[#02a2e0] outline-none transition-colors`}
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
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+27721234567"
              className={`w-full p-3 rounded-2xl border-2 ${
                getFieldError('phoneNumber') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              } focus:border-[#02a2e0] outline-none transition-colors`}
            />
            {getFieldError('phoneNumber') && <p className="mt-1 text-xs text-red-500">{getFieldError('phoneNumber')}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://abctech.com"
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Industry <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="Technology"
              className={`w-full p-3 rounded-2xl border-2 ${
                getFieldError('industry') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              } focus:border-[#02a2e0] outline-none transition-colors`}
            />
            {getFieldError('industry') && <p className="mt-1 text-xs text-red-500">{getFieldError('industry')}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Company Size <span className="text-red-500">*</span>
            </label>
            <select
              name="companySize"
              value={formData.companySize}
              onChange={handleChange}
              className={`w-full p-3 rounded-2xl border-2 ${
                getFieldError('companySize') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              } focus:border-[#02a2e0] outline-none transition-colors`}
            >
              <option value="">Select Size</option>
              <option value="Small">Small (1-50)</option>
              <option value="Medium">Medium (51-200)</option>
              <option value="Large">Large (201-1000)</option>
              <option value="Enterprise">Enterprise (1000+)</option>
            </select>
            {getFieldError('companySize') && <p className="mt-1 text-xs text-red-500">{getFieldError('companySize')}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Registration Number</label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              placeholder="2023/123456/07"
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Tax Number</label>
            <input
              type="text"
              name="taxNumber"
              value={formData.taxNumber}
              onChange={handleChange}
              placeholder="Tax/VAT Number"
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Address */}
        <h3 className="text-lg font-semibold text-[#132149] mt-6 mb-4">📍 Address</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-600 mb-1 block">Street Address</label>
            <input
              type="text"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleChange}
              placeholder="123 Tech Park"
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Johannesburg"
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Province</label>
            <input
              type="text"
              name="province"
              value={formData.province}
              onChange={handleChange}
              placeholder="Gauteng"
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Postal Code</label>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="2196"
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="South Africa"
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Event Selection */}
        <h3 className="text-lg font-semibold text-[#132149] mt-6 mb-4">🎯 Select Event to Sponsor</h3>
        
        {eventsLoading ? (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
            <div className="w-5 h-5 border-3 border-[#02a2e0] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">Loading upcoming events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
            <p className="text-sm text-yellow-700">
              <i className="fas fa-info-circle mr-2"></i>
              No upcoming events available at the moment. Please check back later.
            </p>
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Select an Event <span className="text-red-500">*</span>
            </label>
            <select
              name="eventId"
              value={formData.eventId || ''}
              onChange={handleChange}
              className={`w-full p-3 rounded-2xl border-2 ${
                getFieldError('eventId') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              } focus:border-[#02a2e0] outline-none transition-colors`}
            >
              <option value="">-- Select an event --</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} - {formatDate(event.startDateTime)}
                  {event.venueName && ` (${event.venueName})`}
                </option>
              ))}
            </select>
            {getFieldError('eventId') && <p className="mt-1 text-xs text-red-500">{getFieldError('eventId')}</p>}
            
            {/* Show selected event details */}
            {selectedEventDetails && (
              <div className="mt-3 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div>
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-blue-800">
                      <i className="fas fa-calendar-alt mr-2"></i>
                      {selectedEventDetails.name}
                    </p>
                    {selectedEventDetails.status && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedEventDetails.status)}`}>
                        {selectedEventDetails.status}
                      </span>
                    )}
                  </div>
                  
                  {selectedEventDetails.description && (
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedEventDetails.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-blue-600">
                    {selectedEventDetails.venueName && (
                      <span>
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {selectedEventDetails.venueName}
                        {selectedEventDetails.venueAddress && `, ${selectedEventDetails.venueAddress}`}
                      </span>
                    )}
                    <span>
                      <i className="fas fa-calendar-day mr-1"></i>
                      {formatDate(selectedEventDetails.startDateTime)}
                    </span>
                    <span>
                      <i className="fas fa-clock mr-1"></i>
                      {formatDateTime(selectedEventDetails.startDateTime)}
                      {selectedEventDetails.endDateTime && ` - ${formatDateTime(selectedEventDetails.endDateTime)}`}
                    </span>
                    {selectedEventDetails.maxCapacity > 0 && (
                      <span>
                        <i className="fas fa-users mr-1"></i>
                        Capacity: {selectedEventDetails.currentRegistrations || 0}/{selectedEventDetails.maxCapacity}
                      </span>
                    )}
                    {selectedEventDetails.eventType && (
                      <span>
                        <i className="fas fa-tag mr-1"></i>
                        {selectedEventDetails.eventType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preferred Package */}
        <h3 className="text-lg font-semibold text-[#132149] mt-6 mb-4">🎁 Sponsorship Package</h3>
        
        {packagesLoading ? (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
            <div className="w-5 h-5 border-3 border-[#02a2e0] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">Loading packages...</span>
          </div>
        ) : packages.length === 0 ? (
          <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
            <p className="text-sm text-yellow-700">
              <i className="fas fa-info-circle mr-2"></i>
              No sponsorship packages available at the moment. You can still submit your application without selecting a package.
            </p>
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Select a Package (Optional)</label>
            <select
              name="preferredPackageId"
              value={formData.preferredPackageId || ''}
              onChange={handleChange}
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none transition-colors"
            >
              <option value="">No preference</option>
              {packages.filter(pkg => pkg.isActive !== false).map(pkg => (
                <option key={pkg.packageId} value={pkg.packageId}>
                  {pkg.packageName} - {formatCurrency(pkg.price)} 
                  {pkg.golfPlayers && ` (${pkg.golfPlayers} Golfers`}
                  {pkg.additionalGuests && `, ${pkg.additionalGuests} Guests)`}
                  {!pkg.golfPlayers && !pkg.additionalGuests && ')'}
                </option>
              ))}
            </select>
            
            {/* Show selected package details */}
            {formData.preferredPackageId && (
              <div className="mt-3 p-3 bg-blue-50 rounded-2xl border border-blue-200">
                {packages.find(p => p.packageId === parseInt(formData.preferredPackageId))?.description && (
                  <p className="text-sm text-blue-700">
                    <i className="fas fa-info-circle mr-2"></i>
                    {packages.find(p => p.packageId === parseInt(formData.preferredPackageId))?.description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-600 mb-1 block">Additional Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Any additional information about your sponsorship interest..."
            className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none resize-none transition-colors"
          />
        </div>

        {/* Contact Persons */}
        <h3 className="text-lg font-semibold text-[#132149] mt-6 mb-2">👤 Contact Persons</h3>
        <p className="text-sm text-gray-400 mb-4">At least one contact person is required.</p>
        
        {formData.contactPersons.map((contact, index) => (
          <div key={index} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-3">
            <div className="flex justify-between items-start mb-3">
              <h5 className="text-sm font-medium text-gray-700">Contact #{index + 1}</h5>
              <button
                type="button"
                onClick={() => removeContactPerson(index)}
                className="text-red-400 hover:text-red-600 transition-colors"
                disabled={formData.contactPersons.length <= 1}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contact.fullName}
                  onChange={(e) => handleContactChange(index, 'fullName', e.target.value)}
                  placeholder="John Doe"
                  className={`w-full px-3 py-2 rounded-xl border-2 ${
                    getContactFieldError(index, 'fullName') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  } focus:border-[#02a2e0] outline-none text-sm transition-colors`}
                />
                {getContactFieldError(index, 'fullName') && <p className="mt-1 text-xs text-red-500">{getContactFieldError(index, 'fullName')}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                  placeholder="john@abctech.com"
                  className={`w-full px-3 py-2 rounded-xl border-2 ${
                    getContactFieldError(index, 'email') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  } focus:border-[#02a2e0] outline-none text-sm transition-colors`}
                />
                {getContactFieldError(index, 'email') && <p className="mt-1 text-xs text-red-500">{getContactFieldError(index, 'email')}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={contact.phoneNumber}
                  onChange={(e) => handleContactChange(index, 'phoneNumber', e.target.value)}
                  placeholder="+27721234567"
                  className={`w-full px-3 py-2 rounded-xl border-2 ${
                    getContactFieldError(index, 'phoneNumber') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  } focus:border-[#02a2e0] outline-none text-sm transition-colors`}
                />
                {getContactFieldError(index, 'phoneNumber') && <p className="mt-1 text-xs text-red-500">{getContactFieldError(index, 'phoneNumber')}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
                <input
                  type="text"
                  value={contact.jobTitle}
                  onChange={(e) => handleContactChange(index, 'jobTitle', e.target.value)}
                  placeholder="CEO"
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                <input
                  type="text"
                  value={contact.department}
                  onChange={(e) => handleContactChange(index, 'department', e.target.value)}
                  placeholder="Executive"
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none text-sm transition-colors"
                />
              </div>
              <div className="flex items-center mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contact.isPrimary}
                    onChange={(e) => handleContactChange(index, 'isPrimary', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                  />
                  <span className="text-sm text-gray-700">Primary Contact</span>
                </label>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addContactPerson}
          className="mt-2 text-sm text-[#02a2e0] hover:text-[#0284c7] font-medium flex items-center gap-1 transition-colors"
        >
          <i className="fas fa-plus"></i> Add Contact Person
        </button>

        {/* Submit Button */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
                Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Submit Application
              </>
            )}
          </button>
          <button
            onClick={() => window.history.back()}
            className="border border-gray-300 px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Form Footer */}
        <div className="mt-4 text-xs text-gray-400 text-center">
          <i className="fas fa-lock mr-1"></i> 
          Your information is secure and will only be used for sponsorship processing.
        </div>
      </div>
    </div>
  );
};

export default SponsorApplication;