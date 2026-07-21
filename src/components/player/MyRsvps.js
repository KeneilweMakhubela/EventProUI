import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../Modal';

const MyRsvps = () => {
  const { apiCall, user } = useAuth();
  const [rsvps, setRsvps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDietary, setShowDietary] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [selectedRsvp, setSelectedRsvp] = useState(null);
  const [editData, setEditData] = useState({});
  const [dietary, setDietary] = useState('');
  const [requests, setRequests] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch RSVPs
  const fetchRsvps = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    
    try {
      // Get player ID from user or fetch it
      let playerId = user?.playerId || user?.id;
      
      if (!playerId) {
        // Try to get player by user ID
        try {
          const playerResponse = await apiCall(`/api/Players?page=1&pageSize=1`, 'GET');
          if (playerResponse && playerResponse.items && playerResponse.items.length > 0) {
            playerId = playerResponse.items[0].id;
          }
        } catch (error) {
          console.log('Could not fetch player ID');
        }
      }
      
      if (!playerId) {
        setRsvps([]);
        setIsLoading(false);
        return;
      }

      const response = await apiCall(`/api/RSVP/player/${playerId}`, 'GET');
      console.log('📥 RSVPs response:', response);
      
      if (Array.isArray(response)) {
        setRsvps(response);
      } else if (response && response.items) {
        setRsvps(response.items);
      } else {
        setRsvps([]);
      }
    } catch (error) {
      console.error('❌ Error fetching RSVPs:', error);
      setLoadError(error.message || 'Failed to load RSVPs');
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, user]);

  useEffect(() => {
    fetchRsvps();
  }, [fetchRsvps]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'attending':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle cancel RSVP
  const handleCancel = async (rsvp) => {
    if (!window.confirm(`Are you sure you want to cancel your RSVP for ${rsvp.event?.name || 'this event'}?`)) {
      return;
    }

    setIsSaving(true);
    try {
      // Delete RSVP
      await apiCall(`/api/RSVP/${rsvp.id}`, 'DELETE');
      
      // Update local state
      setRsvps(rsvps.filter(r => r.id !== rsvp.id));
      alert(`RSVP for ${rsvp.event?.name || 'event'} has been cancelled.`);
    } catch (error) {
      console.error('❌ Error cancelling RSVP:', error);
      alert(`Failed to cancel RSVP: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle update RSVP
  const handleUpdateRsvp = async (rsvpId, data) => {
    setIsSaving(true);
    try {
      const response = await apiCall(`/api/RSVP/${rsvpId}`, 'PUT', data);
      
      // Update local state
      const updatedRsvps = rsvps.map(r => 
        r.id === rsvpId ? { ...r, ...data, updatedAt: response.updatedAt || new Date().toISOString() } : r
      );
      setRsvps(updatedRsvps);
      
      // Refresh RSVPs
      await fetchRsvps();
      
      return true;
    } catch (error) {
      console.error('❌ Error updating RSVP:', error);
      alert(`Failed to update RSVP: ${error.message}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!selectedRsvp) return;
    
    const success = await handleUpdateRsvp(selectedRsvp.id, {
      status: editData.status || selectedRsvp.status,
      dietaryRequirements: editData.dietaryRequirements || selectedRsvp.dietaryRequirements || '',
      specialRequests: editData.specialRequests || selectedRsvp.specialRequests || '',
    });
    
    if (success) {
      setShowEdit(false);
      alert('RSVP updated successfully!');
    }
  };

  // Save dietary
  const handleSaveDietary = async () => {
    if (!selectedRsvp) return;
    
    const success = await handleUpdateRsvp(selectedRsvp.id, {
      dietaryRequirements: dietary,
    });
    
    if (success) {
      setShowDietary(false);
      alert('Dietary requirements updated!');
    }
  };

  // Save special requests
  const handleSaveRequests = async () => {
    if (!selectedRsvp) return;
    
    const success = await handleUpdateRsvp(selectedRsvp.id, {
      specialRequests: requests,
    });
    
    if (success) {
      setShowRequests(false);
      alert('Special requests updated!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your RSVPs...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-check-circle text-[#02a2e0]"></i> My RSVPs
      </div>

      {loadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500"></i>
          <p className="text-sm text-red-700 flex-1">{loadError}</p>
          <button onClick={fetchRsvps} className="text-red-500 hover:text-red-700">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {rsvps.length === 0 ? (
          <div className="card-gradient rounded-3xl p-8 shadow-sm border text-center">
            <i className="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">You haven't RSVP'd to any events yet.</p>
            <p className="text-gray-400 text-sm">Discover events and secure your spot!</p>
          </div>
        ) : (
          rsvps.map(rsvp => {
            const eventName = rsvp.event?.name || rsvp.eventName || 'Unknown Event';
            const rsvpDate = rsvp.createdAt || rsvp.rsvpDate || rsvp.createdAt;
            const numberOfGuests = rsvp.numberOfGuests || rsvp.guests || 1;
            const dietaryRequirements = rsvp.dietaryRequirements || rsvp.dietary || '';
            const specialRequests = rsvp.specialRequests || '';
            const status = rsvp.status || 'Pending';

            return (
              <div key={rsvp.id} className="card-gradient rounded-3xl p-5 shadow-sm border hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-[#132149]">{eventName}</h4>
                    <p className="text-sm text-gray-400">
                      RSVP'd on {formatDate(rsvpDate)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(status)}`}>
                    {status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Guests</span>
                    <span className="font-semibold">{numberOfGuests} {numberOfGuests === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-400 block text-xs">Dietary Requirements</span>
                    <span className="font-semibold">{dietaryRequirements || 'None'}</span>
                  </div>
                  {specialRequests && (
                    <div className="bg-gray-50 p-3 rounded-xl col-span-2">
                      <span className="text-gray-400 block text-xs">Special Requests</span>
                      <span className="font-semibold">{specialRequests}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => { setSelectedRsvp(rsvp); setShowDetails(true); }} 
                    className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-50 transition-all"
                  >
                    <i className="fas fa-eye"></i> View Details
                  </button>
                  <button 
                    onClick={() => { 
                      setSelectedRsvp(rsvp); 
                      setEditData({ 
                        status: rsvp.status || 'Attending',
                        dietaryRequirements: dietaryRequirements,
                        specialRequests: specialRequests,
                      }); 
                      setShowEdit(true); 
                    }} 
                    className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-50 transition-all"
                  >
                    <i className="fas fa-edit"></i> Edit RSVP
                  </button>
                  <button 
                    onClick={() => { setSelectedRsvp(rsvp); setDietary(dietaryRequirements); setShowDietary(true); }} 
                    className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-50 transition-all"
                  >
                    <i className="fas fa-utensils"></i> Dietary
                  </button>
                  <button 
                    onClick={() => { setSelectedRsvp(rsvp); setRequests(specialRequests); setShowRequests(true); }} 
                    className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-50 transition-all"
                  >
                    <i className="fas fa-comment"></i> Special Requests
                  </button>
                  <button 
                    onClick={() => handleCancel(rsvp)} 
                    disabled={isSaving}
                    className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    <i className="fas fa-times"></i> Cancel
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RSVP Details Modal */}
      {showDetails && selectedRsvp && (
        <Modal onClose={() => setShowDetails(false)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#132149] mb-4">
              📋 RSVP Details - {selectedRsvp.event?.name || selectedRsvp.eventName || 'Unknown Event'}
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Status</span>
                <span className={`font-semibold ${selectedRsvp.status === 'Attending' ? 'text-green-600' : ''}`}>
                  {selectedRsvp.status || 'Pending'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Event</span>
                <span className="font-semibold">{selectedRsvp.event?.name || selectedRsvp.eventName || 'Unknown'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">RSVP Date</span>
                <span className="font-semibold">{formatDate(selectedRsvp.createdAt || selectedRsvp.rsvpDate)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Number of Guests</span>
                <span className="font-semibold">{selectedRsvp.numberOfGuests || selectedRsvp.guests || 1}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Dietary Requirements</span>
                <span className="font-semibold">{selectedRsvp.dietaryRequirements || selectedRsvp.dietary || 'None'}</span>
              </div>
              <div className="py-2">
                <span className="text-gray-500 block mb-2">Special Requests</span>
                <p className="text-gray-700">{selectedRsvp.specialRequests || 'No special requests'}</p>
              </div>
              {selectedRsvp.isCheckedIn && (
                <div className="bg-green-50 p-3 rounded-xl">
                  <span className="text-green-600 font-semibold">✅ Checked In</span>
                  <p className="text-xs text-gray-500">Checked in on {formatDate(selectedRsvp.checkInTime)}</p>
                </div>
              )}
            </div>
            <button onClick={() => setShowDetails(false)} className="w-full border border-gray-300 px-6 py-3 rounded-full font-semibold">
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Edit RSVP Modal */}
      {showEdit && selectedRsvp && (
        <Modal onClose={() => setShowEdit(false)}>
          <h3 className="text-xl font-bold text-[#132149] mb-4">
            ✏️ Edit RSVP - {selectedRsvp.event?.name || selectedRsvp.eventName || 'Unknown Event'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Status</label>
              <select 
                value={editData.status || 'Attending'} 
                onChange={(e) => setEditData({...editData, status: e.target.value})} 
                className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50"
              >
                <option value="Attending">Attending</option>
                <option value="Maybe">Maybe</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Dietary Requirements</label>
              <select 
                value={editData.dietaryRequirements || ''} 
                onChange={(e) => setEditData({...editData, dietaryRequirements: e.target.value})} 
                className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50"
              >
                <option value="">None</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Gluten-Free">Gluten-Free</option>
                <option value="Halal">Halal</option>
                <option value="Kosher">Kosher</option>
                <option value="Dairy-Free">Dairy-Free</option>
                <option value="Nut-Free">Nut-Free</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Special Requests</label>
              <textarea 
                value={editData.specialRequests || ''} 
                onChange={(e) => setEditData({...editData, specialRequests: e.target.value})} 
                rows="3" 
                className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50"
                placeholder="Any special requests or accommodations needed..."
              ></textarea>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button 
              onClick={handleSaveEdit} 
              disabled={isSaving}
              className="flex-1 btn-primary-gradient text-white px-4 py-2.5 rounded-full font-semibold disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button onClick={() => setShowEdit(false)} className="flex-1 border border-gray-300 px-4 py-2.5 rounded-full font-semibold">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Dietary Modal */}
      {showDietary && selectedRsvp && (
        <Modal onClose={() => setShowDietary(false)}>
          <h3 className="text-xl font-bold text-[#132149] mb-4">🍽️ Dietary Requirements</h3>
          <select 
            value={dietary} 
            onChange={(e) => setDietary(e.target.value)} 
            className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50 mb-4"
          >
            <option value="">None</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="Vegan">Vegan</option>
            <option value="Gluten-Free">Gluten-Free</option>
            <option value="Halal">Halal</option>
            <option value="Kosher">Kosher</option>
            <option value="Dairy-Free">Dairy-Free</option>
            <option value="Nut-Free">Nut-Free</option>
          </select>
          <div className="flex gap-3">
            <button 
              onClick={handleSaveDietary} 
              disabled={isSaving}
              className="flex-1 btn-primary-gradient text-white px-4 py-2.5 rounded-full font-semibold disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Update'}
            </button>
            <button onClick={() => setShowDietary(false)} className="flex-1 border border-gray-300 px-4 py-2.5 rounded-full font-semibold">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Special Requests Modal */}
      {showRequests && selectedRsvp && (
        <Modal onClose={() => setShowRequests(false)}>
          <h3 className="text-xl font-bold text-[#132149] mb-4">💬 Special Requests</h3>
          <textarea 
            value={requests} 
            onChange={(e) => setRequests(e.target.value)} 
            rows="4" 
            className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50 mb-4" 
            placeholder="Enter any special requests or accommodations needed..."
          ></textarea>
          <div className="flex gap-3">
            <button 
              onClick={handleSaveRequests} 
              disabled={isSaving}
              className="flex-1 btn-primary-gradient text-white px-4 py-2.5 rounded-full font-semibold disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setShowRequests(false)} className="flex-1 border border-gray-300 px-4 py-2.5 rounded-full font-semibold">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default MyRsvps;