import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../Modal';

const Payments = () => {
  const { apiCall } = useAuth();
  const [bankDetails, setBankDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  // Form states
  const [editForm, setEditForm] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    branchCode: '',
    referenceInstructions: '',
  });

  // Fetch bank details
  const fetchBankDetails = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    
    try {
      console.log('📡 Fetching bank details...');
      const response = await apiCall('/api/Payment/bank-details', 'GET');
      console.log('📥 Bank details response:', response);
      
      if (response) {
        setBankDetails(response);
        setEditForm({
          bankName: response.bankName || '',
          accountHolder: response.accountHolder || '',
          accountNumber: response.accountNumber || '',
          branchCode: response.branchCode || '',
          referenceInstructions: response.referenceInstructions || '',
        });
      }
    } catch (error) {
      console.error('❌ Error fetching bank details:', error);
      setLoadError(error.message || 'Failed to load bank details');
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchBankDetails();
  }, [fetchBankDetails]);

  // Open edit modal
  const handleEditClick = () => {
    setEditForm({
      bankName: bankDetails?.bankName || '',
      accountHolder: bankDetails?.accountHolder || '',
      accountNumber: bankDetails?.accountNumber || '',
      branchCode: bankDetails?.branchCode || '',
      referenceInstructions: bankDetails?.referenceInstructions || '',
    });
    setValidationErrors({});
    setSaveError('');
    setSaveSuccess('');
    setShowEditModal(true);
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Save bank details
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    setValidationErrors({});
    
    // Build payload
    const dataToSave = {
      bankName: editForm.bankName.trim(),
      accountHolder: editForm.accountHolder.trim(),
      accountNumber: editForm.accountNumber.trim(),
      branchCode: editForm.branchCode.trim(),
      referenceInstructions: editForm.referenceInstructions.trim() || '',
    };

    console.log('📤 Sending bank details to API:', JSON.stringify(dataToSave, null, 2));

    try {
      const response = await apiCall('/api/Payment/bank-details', 'PUT', dataToSave);
      console.log('✅ Bank details updated:', response);
      
      setSaveSuccess('Bank details updated successfully!');
      
      // Refresh bank details
      await fetchBankDetails();
      
      setTimeout(() => {
        setShowEditModal(false);
        setSaveSuccess('');
      }, 1500);
    } catch (error) {
      console.error('❌ Failed to update bank details:', error);
      
      // Display field-specific validation errors
      if (error.details) {
        setValidationErrors(error.details);
        setSaveError('Please fix the highlighted fields.');
      } else {
        setSaveError(error.message || 'Failed to update bank details. Please try again.');
      }
    } finally {
      setIsSaving(false);
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

      {/* Validation Errors Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
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

      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-credit-card text-[#02a2e0]"></i> Bank Details
      </div>

      {/* Bank Details Display */}
      <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Loading bank details...</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-8">
            <i className="fas fa-exclamation-circle text-red-400 text-3xl mb-3"></i>
            <p className="text-red-500">{loadError}</p>
            <button 
              onClick={fetchBankDetails}
              className="mt-3 text-[#02a2e0] hover:underline text-sm"
            >
              <i className="fas fa-redo mr-1"></i> Retry
            </button>
          </div>
        ) : bankDetails ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Bank Name</p>
                <p className="text-lg font-semibold text-[#132149] mt-1">
                  {bankDetails.bankName || 'Not configured'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Account Holder</p>
                <p className="text-lg font-semibold text-[#132149] mt-1">
                  {bankDetails.accountHolder || 'Not configured'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Account Number</p>
                <p className="text-lg font-semibold text-[#132149] mt-1 font-mono">
                  {bankDetails.accountNumber || 'Not configured'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Branch Code</p>
                <p className="text-lg font-semibold text-[#132149] mt-1">
                  {bankDetails.branchCode || 'Not configured'}
                </p>
              </div>
            </div>
            
            {bankDetails.referenceInstructions && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Reference Instructions</p>
                <p className="text-sm text-gray-700 mt-1">
                  {bankDetails.referenceInstructions}
                </p>
              </div>
            )}

            <button 
              onClick={handleEditClick}
              className="mt-2 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
            >
              <i className="fas fa-edit"></i> Edit Bank Details
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <i className="fas fa-university text-gray-300 text-4xl mb-3"></i>
            <p className="text-gray-500">No bank details configured</p>
            <button 
              onClick={handleEditClick}
              className="mt-3 btn-primary-gradient text-white px-6 py-2.5 rounded-full text-sm font-semibold"
            >
              <i className="fas fa-plus mr-1"></i> Add Bank Details
            </button>
          </div>
        )}
      </div>

      {/* Edit Bank Details Modal */}
      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#132149] mb-4">
              <i className="fas fa-edit text-[#02a2e0] mr-2"></i>
              {bankDetails ? 'Edit Bank Details' : 'Add Bank Details'}
            </h3>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                <i className="fas fa-exclamation-circle mr-1"></i> {saveError}
              </div>
            )}

            {/* Validation Errors Summary */}
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
              {/* Bank Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={editForm.bankName}
                  onChange={handleChange}
                  placeholder="e.g., First National Bank"
                  className={`w-full p-3 rounded-2xl border-2 ${
                    getFieldError('bankName') 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 bg-gray-50'
                  } focus:border-[#02a2e0] focus:bg-white outline-none transition-all`}
                />
                {getFieldError('bankName') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('bankName')}</p>
                )}
              </div>

              {/* Account Holder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountHolder"
                  value={editForm.accountHolder}
                  onChange={handleChange}
                  placeholder="e.g., ABC Sports Club"
                  className={`w-full p-3 rounded-2xl border-2 ${
                    getFieldError('accountHolder') 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 bg-gray-50'
                  } focus:border-[#02a2e0] focus:bg-white outline-none transition-all`}
                />
                {getFieldError('accountHolder') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('accountHolder')}</p>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={editForm.accountNumber}
                  onChange={handleChange}
                  placeholder="e.g., 1234567890"
                  className={`w-full p-3 rounded-2xl border-2 ${
                    getFieldError('accountNumber') 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 bg-gray-50'
                  } focus:border-[#02a2e0] focus:bg-white outline-none transition-all`}
                />
                {getFieldError('accountNumber') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('accountNumber')}</p>
                )}
              </div>

              {/* Branch Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="branchCode"
                  value={editForm.branchCode}
                  onChange={handleChange}
                  placeholder="e.g., 255005"
                  className={`w-full p-3 rounded-2xl border-2 ${
                    getFieldError('branchCode') 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 bg-gray-50'
                  } focus:border-[#02a2e0] focus:bg-white outline-none transition-all`}
                />
                {getFieldError('branchCode') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('branchCode')}</p>
                )}
              </div>

              {/* Reference Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Instructions
                </label>
                <textarea
                  name="referenceInstructions"
                  value={editForm.referenceInstructions}
                  onChange={handleChange}
                  placeholder="e.g., Please use your Player ID as reference"
                  rows="3"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all resize-none"
                />
                {getFieldError('referenceInstructions') && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError('referenceInstructions')}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
                ) : (
                  <><i className="fas fa-save"></i> Save Bank Details</>
                )}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="border border-gray-300 px-6 py-3 rounded-full font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Payments;