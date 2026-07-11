import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../Modal';

const AdminEvents = () => {
  const { apiCall } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venueName: '',
    venueAddress: '',
    latitude: '',
    longitude: '',
    startDateTime: '',
    endDateTime: '',
    maxCapacity: '',
    eventType: '',
    bannerImageUrl: '',
    status: 'Draft',
    isActive: true,
    customFields: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  
  // Filter states
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const eventsPerPage = 10;

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    
    try {
      let endpoint = `/api/Events?page=${currentPage}&pageSize=${eventsPerPage}`;
      
      if (searchTerm) {
        endpoint += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (filter === 'upcoming') {
        endpoint = `/api/Events/upcoming?days=30`;
      } else if (filter === 'past') {
        endpoint = `/api/Events/past`;
      }
      
      console.log('📡 Fetching events:', endpoint);
      const response = await apiCall(endpoint, 'GET');
      
      console.log('📥 Events response:', response);
      
      if (response) {
        if (Array.isArray(response)) {
          setEvents(response);
          setTotalPages(1);
        } else if (response.items) {
          setEvents(response.items);
          setTotalPages(response.totalPages || 1);
        } else if (response.data) {
          setEvents(response.data);
          setTotalPages(response.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      setLoadError(error.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, currentPage, searchTerm, filter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Open create/edit form
  const openEventForm = (event = null) => {
    if (event) {
      setSelectedEvent(event);
      setFormData({
        name: event.name || '',
        description: event.description || '',
        venueName: event.venueName || '',
        venueAddress: event.venueAddress || '',
        latitude: event.latitude !== undefined ? event.latitude : '',
        longitude: event.longitude !== undefined ? event.longitude : '',
        startDateTime: event.startDateTime ? event.startDateTime.slice(0, 16) : '',
        endDateTime: event.endDateTime ? event.endDateTime.slice(0, 16) : '',
        maxCapacity: event.maxCapacity !== undefined ? event.maxCapacity : '',
        eventType: event.eventType || '',
        bannerImageUrl: event.bannerImageUrl || '',
        status: event.status || 'Draft',
        isActive: event.isActive !== undefined ? event.isActive : true,
        customFields: event.customFields || []
      });
    } else {
      setSelectedEvent(null);
      setFormData({
        name: '',
        description: '',
        venueName: '',
        venueAddress: '',
        latitude: '',
        longitude: '',
        startDateTime: '',
        endDateTime: '',
        maxCapacity: '',
        eventType: '',
        bannerImageUrl: '',
        status: 'Draft',
        isActive: true,
        customFields: []
      });
    }
    setFormErrors({});
    setSaveError('');
    setSaveSuccess('');
    setShowFormModal(true);
  };

  // Handle form field changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle custom field changes
  const handleCustomFieldChange = (index, field, value) => {
    setFormData(prev => {
      const updatedFields = [...prev.customFields];
      updatedFields[index] = { ...updatedFields[index], [field]: value };
      return { ...prev, customFields: updatedFields };
    });
  };

  // Add custom field
  const addCustomField = () => {
    setFormData(prev => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        {
          fieldName: '',
          fieldType: 'Text',
          isRequired: false,
          defaultValue: '',
          placeholder: '',
          displayOrder: prev.customFields.length,
          options: []
        }
      ]
    }));
  };

  // Remove custom field
  const removeCustomField = (index) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Event name is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!formData.venueName.trim()) {
      errors.venueName = 'Venue name is required';
    }
    if (!formData.startDateTime) {
      errors.startDateTime = 'Start date & time is required';
    }
    if (!formData.endDateTime) {
      errors.endDateTime = 'End date & time is required';
    }
    if (formData.startDateTime && formData.endDateTime) {
      const start = new Date(formData.startDateTime);
      const end = new Date(formData.endDateTime);
      if (end <= start) {
        errors.endDateTime = 'End time must be after start time';
      }
    }
    if (formData.maxCapacity && parseInt(formData.maxCapacity) < 1) {
      errors.maxCapacity = 'Capacity must be at least 1';
    }
    
    // Validate custom fields
    formData.customFields.forEach((field, index) => {
      if (!field.fieldName.trim()) {
        errors[`customField_${index}`] = 'Field name is required';
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save event (Create or Update)
  const handleSaveEvent = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');
    
    try {
      const dataToSend = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        venueName: formData.venueName.trim(),
        venueAddress: formData.venueAddress?.trim() || '',
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        startDateTime: new Date(formData.startDateTime).toISOString(),
        endDateTime: new Date(formData.endDateTime).toISOString(),
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : 0,
        eventType: formData.eventType || '',
        bannerImageUrl: formData.bannerImageUrl || '',
        customFields: formData.customFields.map(field => ({
          fieldName: field.fieldName,
          fieldType: field.fieldType || 'Text',
          isRequired: field.isRequired || false,
          defaultValue: field.defaultValue || '',
          placeholder: field.placeholder || '',
          displayOrder: field.displayOrder || 0,
          options: field.options || []
        }))
      };

      if (selectedEvent) {
        // Update existing event - PUT /api/Events/{id}
        const updateData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          venueName: formData.venueName.trim(),
          venueAddress: formData.venueAddress?.trim() || '',
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          startDateTime: new Date(formData.startDateTime).toISOString(),
          endDateTime: new Date(formData.endDateTime).toISOString(),
          maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : 0,
          status: formData.status,
          eventType: formData.eventType || '',
          bannerImageUrl: formData.bannerImageUrl || '',
          isActive: formData.isActive
        };
        console.log(`🔄 Updating event ${selectedEvent.id}`);
        await apiCall(`/api/Events/${selectedEvent.id}`, 'PUT', updateData);
        setSaveSuccess('Event updated successfully!');
      } else {
        // Create new event - POST /api/Events
        console.log('🔄 Creating new event');
        await apiCall('/api/Events', 'POST', dataToSend);
        setSaveSuccess('Event created successfully!');
      }
      
      // Refresh events list
      await fetchEvents();
      
      // Close modal after short delay
      setTimeout(() => {
        setShowFormModal(false);
        setSaveSuccess('');
      }, 1500);
    } catch (error) {
      console.error('❌ Error saving event:', error);
      setSaveError(error.message || 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish event
  const handlePublish = async (event) => {
    try {
      console.log(`🔄 Publishing event ${event.id}`);
      await apiCall(`/api/Events/${event.id}/publish`, 'POST');
      setSaveSuccess(`"${event.name}" has been published!`);
      await fetchEvents();
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error publishing event:', error);
      setSaveError(`Failed to publish: ${error.message}`);
      setTimeout(() => setSaveError(''), 3000);
    }
  };

  // View event details
  const handleViewDetails = async (event) => {
    try {
      console.log(`📡 Fetching details for event ${event.id}`);
      const response = await apiCall(`/api/Events/${event.id}`, 'GET');
      setSelectedEvent(response || event);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('❌ Error fetching event details:', error);
      setSelectedEvent(event);
      setShowDetailsModal(true);
    }
  };

  // Delete event
  const handleDelete = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedEvent) return;
    
    try {
      console.log(`🗑️ Deleting event ${selectedEvent.id}`);
      await apiCall(`/api/Events/${selectedEvent.id}`, 'DELETE');
      setShowDeleteModal(false);
      setSelectedEvent(null);
      setSaveSuccess(`"${selectedEvent.name}" has been cancelled.`);
      await fetchEvents();
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      setSaveError(`Failed to delete: ${error.message}`);
      setTimeout(() => setSaveError(''), 3000);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2 text-2xl font-bold text-[#132149]">
          <i className="fas fa-calendar-alt text-[#02a2e0]"></i> Events
        </div>
        <button 
          onClick={() => openEventForm()}
          className="btn-primary-gradient text-white px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-semibold"
        >
          <i className="fas fa-plus"></i> Create Event
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-gradient rounded-3xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 rounded-full p-1">
            {[
              { value: 'all', label: 'All Events' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'past', label: 'Past' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setFilter(tab.value); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === tab.value
                    ? 'bg-[#02a2e0] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm focus:border-[#02a2e0] outline-none"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Error Message */}
      {loadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500"></i>
          <p className="text-sm text-red-700">{loadError}</p>
          <button onClick={fetchEvents} className="ml-auto text-red-500 hover:text-red-700">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      )}

      {/* Events Table */}
      <div className="card-gradient rounded-3xl p-4 shadow-sm border border-gray-100 overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-calendar-times text-5xl text-gray-300 mb-3"></i>
            <p className="text-gray-500">No events found</p>
            <button onClick={() => openEventForm()} className="text-[#02a2e0] text-sm mt-2 hover:underline">
              Create your first event
            </button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-[#132149] uppercase text-xs font-bold">
                  <th className="p-3 text-left rounded-l-xl">Event Name</th>
                  <th className="p-3 text-left hidden md:table-cell">Date</th>
                  <th className="p-3 text-left hidden lg:table-cell">Venue</th>
                  <th className="p-3 text-center">Capacity</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-left rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <strong className="text-[#132149]">{event.name}</strong>
                      <div className="md:hidden text-xs text-gray-400 mt-1">
                        {formatDate(event.startDateTime)} • {event.venueName}
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-gray-600">
                      {formatDate(event.startDateTime)}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-gray-500 text-xs">
                      {event.venueName}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-medium">{event.currentRegistrations || 0}</span>
                      <span className="text-gray-400">/{event.maxCapacity || '∞'}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(event.status)}`}>
                        {event.status || 'Draft'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => handleViewDetails(event)}
                          className="bg-white border border-gray-200 p-2 rounded-full text-xs hover:bg-gray-50"
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => openEventForm(event)}
                          className="bg-white border border-gray-200 p-2 rounded-full text-xs hover:bg-gray-50"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        {event.status?.toLowerCase() !== 'published' && event.status?.toLowerCase() !== 'cancelled' && (
                          <button
                            onClick={() => handlePublish(event)}
                            className="bg-white border border-green-200 text-green-600 p-2 rounded-full text-xs hover:bg-green-50"
                            title="Publish"
                          >
                            <i className="fas fa-paper-plane"></i>
                          </button>
                        )}
                        {event.status?.toLowerCase() !== 'cancelled' && (
                          <button
                            onClick={() => handleDelete(event)}
                            className="bg-white border border-red-200 text-red-600 p-2 rounded-full text-xs hover:bg-red-50"
                            title="Cancel/Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border bg-white text-sm disabled:opacity-50"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border bg-white text-sm disabled:opacity-50"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Event Modal */}
      {showFormModal && (
        <Modal onClose={() => setShowFormModal(false)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#132149] mb-4">
              <i className={`fas ${selectedEvent ? 'fa-edit' : 'fa-plus-circle'} text-[#02a2e0] mr-2`}></i>
              {selectedEvent ? 'Edit Event' : 'Create New Event'}
            </h3>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                <i className="fas fa-exclamation-circle mr-1"></i> {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700">
                <i className="fas fa-check-circle mr-1"></i> {saveSuccess}
              </div>
            )}

            <div className="space-y-4">
              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g., Annual Golf Tournament"
                  className={`w-full p-3 rounded-2xl border-2 ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Event description..."
                  rows="3"
                  className={`w-full p-3 rounded-2xl border-2 ${formErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none resize-none`}
                />
                {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
              </div>

              {/* Venue Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
                <input
                  type="text"
                  name="venueName"
                  value={formData.venueName}
                  onChange={handleFormChange}
                  placeholder="e.g., Royal Golf Club"
                  className={`w-full p-3 rounded-2xl border-2 ${formErrors.venueName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`}
                />
                {formErrors.venueName && <p className="text-xs text-red-500 mt-1">{formErrors.venueName}</p>}
              </div>

              {/* Venue Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue Address</label>
                <input
                  type="text"
                  name="venueAddress"
                  value={formData.venueAddress}
                  onChange={handleFormChange}
                  placeholder="123 Sports Avenue, Johannesburg"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                />
              </div>

              {/* Latitude & Longitude */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleFormChange}
                    placeholder="-26.2041"
                    step="any"
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleFormChange}
                    placeholder="28.0473"
                    step="any"
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
              </div>

              {/* Start & End Date/Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    name="startDateTime"
                    value={formData.startDateTime}
                    onChange={handleFormChange}
                    className={`w-full p-3 rounded-2xl border-2 ${formErrors.startDateTime ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`}
                  />
                  {formErrors.startDateTime && <p className="text-xs text-red-500 mt-1">{formErrors.startDateTime}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    name="endDateTime"
                    value={formData.endDateTime}
                    onChange={handleFormChange}
                    className={`w-full p-3 rounded-2xl border-2 ${formErrors.endDateTime ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`}
                  />
                  {formErrors.endDateTime && <p className="text-xs text-red-500 mt-1">{formErrors.endDateTime}</p>}
                </div>
              </div>

              {/* Max Capacity & Event Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    name="maxCapacity"
                    value={formData.maxCapacity}
                    onChange={handleFormChange}
                    placeholder="100"
                    min="0"
                    className={`w-full p-3 rounded-2xl border-2 ${formErrors.maxCapacity ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-[#02a2e0] outline-none`}
                  />
                  {formErrors.maxCapacity && <p className="text-xs text-red-500 mt-1">{formErrors.maxCapacity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <input
                    type="text"
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleFormChange}
                    placeholder="Sports, Conference, Workshop"
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  />
                </div>
              </div>

              {/* Banner Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL</label>
                <input
                  type="url"
                    name="bannerImageUrl"
                  value={formData.bannerImageUrl}
                  onChange={handleFormChange}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                />
              </div>

              {/* Status (Only for editing) */}
              {selectedEvent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              {/* Is Active (Only for editing) */}
              {selectedEvent && (
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleFormChange}
                      className="w-5 h-5 rounded-lg border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                    />
                    <span className="text-sm font-medium text-gray-700">Event is Active</span>
                  </label>
                </div>
              )}

              {/* Custom Fields Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-[#132149]">Custom Registration Fields</h4>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="text-sm text-[#02a2e0] hover:text-[#0284c7] font-medium flex items-center gap-1"
                  >
                    <i className="fas fa-plus"></i> Add Field
                  </button>
                </div>

                {formData.customFields.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No custom fields added</p>
                ) : (
                  <div className="space-y-3">
                    {formData.customFields.map((field, index) => (
                      <div key={index} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="text-sm font-medium text-gray-700">Field #{index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeCustomField(index)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Field Name *
                            </label>
                            <input
                              type="text"
                              value={field.fieldName}
                              onChange={(e) => handleCustomFieldChange(index, 'fieldName', e.target.value)}
                              placeholder="T-Shirt Size"
                              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none transition-all text-sm"
                            />
                            {formErrors[`customField_${index}`] && (
                              <p className="text-xs text-red-500 mt-1">{formErrors[`customField_${index}`]}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Field Type</label>
                            <select
                              value={field.fieldType}
                              onChange={(e) => handleCustomFieldChange(index, 'fieldType', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none transition-all text-sm"
                            >
                              <option value="Text">Text</option>
                              <option value="Dropdown">Dropdown</option>
                              <option value="Number">Number</option>
                              <option value="Date">Date</option>
                              <option value="Checkbox">Checkbox</option>
                              <option value="Radio">Radio</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
                            <input
                              type="text"
                              value={field.placeholder}
                              onChange={(e) => handleCustomFieldChange(index, 'placeholder', e.target.value)}
                              placeholder="Enter your size"
                              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Default Value</label>
                            <input
                              type="text"
                              value={field.defaultValue}
                              onChange={(e) => handleCustomFieldChange(index, 'defaultValue', e.target.value)}
                              placeholder="Medium"
                              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
                            <input
                              type="number"
                              value={field.displayOrder}
                              onChange={(e) => handleCustomFieldChange(index, 'displayOrder', parseInt(e.target.value))}
                              placeholder="0"
                              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none transition-all text-sm"
                            />
                          </div>
                          <div className="flex items-center mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.isRequired}
                                onChange={(e) => handleCustomFieldChange(index, 'isRequired', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                              />
                              <span className="text-sm text-gray-700">Required</span>
                            </label>
                          </div>
                          {field.fieldType === 'Dropdown' && (
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Options (comma separated)
                              </label>
                              <input
                                type="text"
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => handleCustomFieldChange(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                                placeholder="Small, Medium, Large, XL"
                                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus:border-[#02a2e0] outline-none transition-all text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEvent}
                disabled={isSaving}
                className="flex-1 btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i> {selectedEvent ? 'Update Event' : 'Create Event'}
                  </>
                )}
              </button>
              <button
                onClick={() => setShowFormModal(false)}
                className="border border-gray-300 px-6 py-3 rounded-full font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedEvent && (
        <Modal onClose={() => setShowDetailsModal(false)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#132149] mb-4">
              <i className="fas fa-info-circle text-[#02a2e0] mr-2"></i>
              Event Details
            </h3>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="text-lg font-bold text-[#132149]">{selectedEvent.name}</h4>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedEvent.status)}`}>
                  {selectedEvent.status || 'Draft'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-400 block text-xs">Start Date</span>
                  <span className="font-semibold">{formatDate(selectedEvent.startDateTime)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-400 block text-xs">End Date</span>
                  <span className="font-semibold">{formatDate(selectedEvent.endDateTime)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-400 block text-xs">Venue</span>
                  <span className="font-semibold">{selectedEvent.venueName}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-400 block text-xs">Capacity</span>
                  <span className="font-semibold">{selectedEvent.currentRegistrations || 0} / {selectedEvent.maxCapacity || '∞'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-400 block text-xs">Event Type</span>
                  <span className="font-semibold">{selectedEvent.eventType || 'N/A'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-400 block text-xs">Active</span>
                  <span className="font-semibold">{selectedEvent.isActive ? '✅ Yes' : '❌ No'}</span>
                </div>
                {selectedEvent.latitude && selectedEvent.longitude && (
                  <div className="bg-gray-50 p-3 rounded-xl col-span-2">
                    <span className="text-gray-400 block text-xs">Location</span>
                    <span className="font-semibold text-xs">{selectedEvent.latitude}, {selectedEvent.longitude}</span>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.venueAddress && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Venue Address</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedEvent.venueAddress}</p>
                </div>
              )}

              {selectedEvent.customFields && selectedEvent.customFields.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Custom Registration Fields</label>
                  <div className="mt-1 space-y-1">
                    {selectedEvent.customFields.map((field, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded-xl">
                        <span className="font-medium">{field.fieldName}</span>
                        <span className="text-xs text-gray-400 ml-2">({field.fieldType}{field.isRequired ? ', Required' : ''})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400">
                {selectedEvent.createdAt && <p>Created: {formatDate(selectedEvent.createdAt)}</p>}
                {selectedEvent.updatedAt && <p>Updated: {formatDate(selectedEvent.updatedAt)}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {selectedEvent.status?.toLowerCase() !== 'published' && selectedEvent.status?.toLowerCase() !== 'cancelled' && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handlePublish(selectedEvent);
                  }}
                  className="flex-1 bg-green-500 text-white px-4 py-3 rounded-full font-semibold text-sm"
                >
                  <i className="fas fa-paper-plane mr-1"></i> Publish
                </button>
              )}
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  openEventForm(selectedEvent);
                }}
                className="flex-1 btn-primary-gradient text-white px-4 py-3 rounded-full font-semibold text-sm"
              >
                <i className="fas fa-edit mr-1"></i> Edit
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 border border-gray-300 px-4 py-3 rounded-full font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEvent && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-[#132149] mb-2">Cancel Event</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to cancel <strong>"{selectedEvent.name}"</strong>?
            </p>
            <p className="text-xs text-gray-400 mb-6">
              This will set the event status to "Cancelled". This action can be reversed if needed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 text-white px-6 py-3 rounded-full font-semibold"
              >
                <i className="fas fa-trash mr-1"></i> Yes, Cancel Event
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 border border-gray-300 px-6 py-3 rounded-full font-semibold"
              >
                Keep Event
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AdminEvents;