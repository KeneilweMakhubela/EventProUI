import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SponsorApplication = () => {
  const { apiCall } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [step, setStep] = useState(1);
  const [packages, setPackages] = useState([]);
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
    preferredPackageId: null,
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
  // FETCH PACKAGES FROM DATABASE
  // ============================================================
  useEffect(() => {
    const fetchPackages = async () => {
      setPackagesLoading(true);
      try {
        console.log('📡 Fetching sponsorship packages from database...');
        const response = await apiCall('/api/Sponsor/packages', 'GET');
        console.log('📥 Packages response:', response);
        
        // Handle different response formats
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
        // Don't set error for packages - user can still submit without selecting
      } finally {
        setPackagesLoading(false);
      }
    };
    
    fetchPackages();
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
    if (!formData.industry) {
      errors.industry = 'Industry is required';
    }
    if (!formData.companySize) {
      errors.companySize = 'Company size is required';
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
    if (formData.contactPersons.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      contactPersons: prev.contactPersons.filter((_, i) => i !== index)
    }));
  };

  // ============================================================
  // SUBMIT APPLICATION
  // ============================================================
  const handleSubmit = async () => {
    if (!validateForm()) {
      setSaveError('Please fix the highlighted fields.');
      return;
    }

    setIsLoading(true);
    setSaveError('');
    setValidationErrors({});

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

    console.log('📤 Submitting sponsor application:', dataToSave);

    try {
      const response = await apiCall('/api/Sponsor/apply', 'POST', dataToSave);
      console.log('✅ Application submitted:', response);
      setSaveSuccess('Sponsorship application submitted successfully! Our team will review your application and contact you soon.');
      setStep(2);
      setTimeout(() => setSaveSuccess(''), 8000);
    } catch (error) {
      console.error('❌ Error submitting application:', error);
      if (error.details) {
        setValidationErrors(error.details);
        setSaveError('Please fix the highlighted fields.');
      } else {
        setSaveError(error.message || 'Failed to submit application. Please try again.');
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

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
          <p className="text-sm text-gray-500">You will receive a confirmation email shortly.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-star text-[#02a2e0]"></i> Apply for Sponsorship
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#02a2e0] text-white flex items-center justify-center text-sm font-bold">1</div>
          <span className="font-semibold text-[#132149]">Company Details</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-bold">2</div>
          <span className="text-gray-400">Contact Persons</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
          <span className="text-gray-400">Submit</span>
        </div>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700">
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          {saveError}
        </div>
      )}

      <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100">
        {/* Company Information */}
        <h3 className="text-lg font-semibold text-[#132149] mb-4">🏢 Company Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Company Name *</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="ABC Tech Solutions"
              className={`w-full p-3 rounded-2xl border-2 ${
                getFieldError('companyName') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              } focus:border-[#02a2e0] outline-none`}
            />
            {getFieldError('companyName') && <p className="mt-1 text-xs text-red-500">{getFieldError('companyName')}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="info@abctech.com"
              className={`w-full p-3 rounded-2xl border-2 ${
                getFieldError('email') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              } focus:border-[#02a2e0] outline-none`}
            />
            {getFieldError('email') && <p className="mt-1 text-xs text-red-500">{getFieldError('email')}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+27721234567"
              className={`w-full p-3 rounded-2xl border-2 ${
                getFieldError('phoneNumber') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              } focus:border-[#02a2e0] outline-none`}
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
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Industry *</label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="Technology"
              className={`w-full p-3 rounded-2xl border-2 ${
                getFieldError('industry') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              } focus:border-[#02a2e0] outline-none`}
            />
            {getFieldError('industry') && <p className="mt-1 text-xs text-red-500">{getFieldError('industry')}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Company Size *</label>
            <select
              name="companySize"
              value={formData.companySize}
              onChange={handleChange}
              className={`w-full p-3 rounded-2xl border-2 ${
                getFieldError('companySize') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              } focus:border-[#02a2e0] outline-none`}
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
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
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
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
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
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
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
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
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
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
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
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
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
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
            />
          </div>
        </div>

        {/* Preferred Package - Loading from Database */}
        <h3 className="text-lg font-semibold text-[#132149] mt-6 mb-4">🎁 Preferred Sponsorship Package (Required)</h3>
        
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
            <label className="text-sm font-medium text-gray-600 mb-1 block">Select a Package</label>
            <select
              name="preferredPackageId"
              value={formData.preferredPackageId || ''}
              onChange={handleChange}
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
            >
              <option value="">No preference</option>
              {packages.filter(pkg => pkg.isActive !== false).map(pkg => (
                <option key={pkg.packageId} value={pkg.packageId}>
                  {pkg.packageName} - {formatCurrency(pkg.price)} ({pkg.golfPlayers || 0} Golfers, {pkg.additionalGuests || 0} Guests)
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
            className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none resize-none"
          />
        </div>

        {/* Contact Persons */}
        <h3 className="text-lg font-semibold text-[#132149] mt-6 mb-4">👤 Contact Persons</h3>
        <p className="text-sm text-gray-400 mb-4">At least one contact person is required.</p>
        
        {formData.contactPersons.map((contact, index) => (
          <div key={index} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-3">
            <div className="flex justify-between items-start mb-3">
              <h5 className="text-sm font-medium text-gray-700">Contact #{index + 1}</h5>
              <button
                type="button"
                onClick={() => removeContactPerson(index)}
                className="text-red-400 hover:text-red-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={contact.fullName}
                  onChange={(e) => handleContactChange(index, 'fullName', e.target.value)}
                  placeholder="John Doe"
                  className={`w-full px-3 py-2 rounded-xl border-2 ${
                    getContactFieldError(index, 'fullName') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  } focus:border-[#02a2e0] outline-none text-sm`}
                />
                {getContactFieldError(index, 'fullName') && <p className="mt-1 text-xs text-red-500">{getContactFieldError(index, 'fullName')}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                  placeholder="john@abctech.com"
                  className={`w-full px-3 py-2 rounded-xl border-2 ${
                    getContactFieldError(index, 'email') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  } focus:border-[#02a2e0] outline-none text-sm`}
                />
                {getContactFieldError(index, 'email') && <p className="mt-1 text-xs text-red-500">{getContactFieldError(index, 'email')}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={contact.phoneNumber}
                  onChange={(e) => handleContactChange(index, 'phoneNumber', e.target.value)}
                  placeholder="+27721234567"
                  className={`w-full px-3 py-2 rounded-xl border-2 ${
                    getContactFieldError(index, 'phoneNumber') ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  } focus:border-[#02a2e0] outline-none text-sm`}
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
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                <input
                  type="text"
                  value={contact.department}
                  onChange={(e) => handleContactChange(index, 'department', e.target.value)}
                  placeholder="Executive"
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none text-sm"
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
          className="mt-2 text-sm text-[#02a2e0] hover:text-[#0284c7] font-medium flex items-center gap-1"
        >
          <i className="fas fa-plus"></i> Add Contact Person
        </button>

        {/* Submit Button */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Submitting...</>
            ) : (
              <><i className="fas fa-paper-plane"></i> Submit Application</>
            )}
          </button>
          <button
            onClick={() => window.history.back()}
            className="border border-gray-300 px-6 py-3 rounded-full font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SponsorApplication;