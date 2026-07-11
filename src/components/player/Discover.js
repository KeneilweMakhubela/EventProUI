import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../Modal';

const Discover = () => {
  const { apiCall, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [isRsvping, setIsRsvping] = useState(false);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const response = await apiCall('/api/Events?page=1&pageSize=100', 'GET');
      if (response && response.items) {
        setEvents(response.items);
      } else if (Array.isArray(response)) {
        setEvents(response);
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
    }
  }, [apiCall]);

  // Fetch user's RSVPs
  const fetchRsvps = useCallback(async () => {
    try {
      // First get player profile by user ID
      const playerResponse = await apiCall(`/api/Players?page=1&pageSize=1`, 'GET');
      let playerId = user?.id;
      
      // Try to get player ID from user object
      if (user?.playerId) {
        playerId = user.playerId;
      }
      
      if (playerId) {
        const response = await apiCall(`/api/RSVP/player/${playerId}`, 'GET');
        if (Array.isArray(response)) {
          setRsvps(response);
        } else if (response && response.items) {
          setRsvps(response.items);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching RSVPs:', error);
    }
  }, [apiCall, user]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        await Promise.all([fetchEvents(), fetchRsvps()]);
      } catch (error) {
        setLoadError('Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchEvents, fetchRsvps]);

  // Published events (status === 'Published')
  const publishedEvents = events.filter(e => e.status?.toLowerCase() === 'published' || e.isActive === true);

  // Handle RSVP
  const handleRsvp = async (event) => {
    // Check if already RSVP'd
    const existingRsvp = rsvps.find(r => r.eventId === event.id);
    if (existingRsvp) {
      alert(`You have already RSVP'd for ${event.name}!`);
      return;
    }

    // Get player ID
    let playerId = user?.playerId || user?.id;
    if (!playerId) {
      alert('Please log in to RSVP.');
      return;
    }

    setIsRsvping(true);
    try {
      const rsvpData = {
        eventId: event.id,
        playerId: parseInt(playerId),
        status: 'Attending',
        numberOfGuests: 1,
        dietaryRequirements: '',
        specialRequests: '',
      };

      const response = await apiCall('/api/RSVP', 'POST', rsvpData);
      
      if (response) {
        // Add to local RSVPs
        const newRsvp = {
          id: response.rsvpId || Date.now(),
          eventId: event.id,
          eventName: event.name,
          status: 'Attending',
          rsvpDate: new Date().toISOString().split('T')[0],
        };
        setRsvps([...rsvps, newRsvp]);
        alert(`✅ RSVP confirmed for ${event.name}!`);
        
        // Refresh RSVPs
        await fetchRsvps();
      }
    } catch (error) {
      console.error('❌ Error creating RSVP:', error);
      alert(`Failed to RSVP: ${error.message}`);
    } finally {
      setIsRsvping(false);
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
      minute: '2-digit',
    });
  };

  // Check if user has RSVP'd for an event
  const hasRsvped = (eventId) => {
    return rsvps.some(r => r.eventId === eventId);
  };

  // Get event location URL
  const getGoogleMapsUrl = (event) => {
    if (event.latitude && event.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
    }
    if (event.venueAddress) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueName || '')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-compass text-[#02a2e0]"></i> Discover Events
      </div>

      {loadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500"></i>
          <p className="text-sm text-red-700 flex-1">{loadError}</p>
          <button onClick={() => window.location.reload()} className="text-red-500 hover:text-red-700">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      )}

      {publishedEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-3xl">
          <i className="fas fa-calendar-times text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">No events available at the moment.</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for new events.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publishedEvents.map((ev) => {
            const isRsvped = hasRsvped(ev.id);
            return (
              <div key={ev.id} className="card-gradient rounded-3xl p-5 shadow-sm border hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-lg text-[#132149]">{ev.name}</h4>
                  <div className="flex items-center gap-2">
                    {isRsvped && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        <i className="fas fa-check mr-1"></i> RSVP'd
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      {ev.status || 'Published'}
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-2">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  {ev.venueName || ev.venue || 'Venue TBA'} · {formatDate(ev.startDateTime || ev.date)}
                </p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {ev.description || ev.desc || 'No description available.'}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button 
                    onClick={() => { setSelectedEvent(ev); setShowDetails(true); }} 
                    className="bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-50 transition-all"
                  >
                    <i className="fas fa-info-circle mr-1"></i> View Details
                  </button>
                  <button 
                    onClick={() => { setSelectedEvent(ev); setShowShare(true); }} 
                    className="bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-50 transition-all"
                  >
                    <i className="fas fa-share-alt mr-1"></i> Share
                  </button>
                  {ev.latitude && ev.longitude && (
                    <button 
                      onClick={() => { setSelectedEvent(ev); setShowMap(true); }} 
                      className="bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-50 transition-all"
                    >
                      <i className="fas fa-map mr-1"></i> View Map
                    </button>
                  )}
                  <button 
                    onClick={() => { setSelectedEvent(ev); setShowTickets(true); }} 
                    className="bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-50 transition-all"
                  >
                    <i className="fas fa-ticket-alt mr-1"></i> Details
                  </button>
                  <button 
                    onClick={() => handleRsvp(ev)} 
                    disabled={isRsvping || isRsvped}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      isRsvped 
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'btn-primary-gradient text-white hover:shadow-lg hover:shadow-cyan-500/50'
                    }`}
                  >
                    <i className={`fas ${isRsvped ? 'fa-check' : 'fa-check-circle'} mr-1`}></i>
                    {isRsvped ? 'RSVP\'d' : 'RSVP'}
                  </button>
                </div>
                {ev.currentRegistrations !== undefined && ev.maxCapacity && (
                  <p className="text-xs text-gray-400 mt-3">
                    <i className="fas fa-users mr-1"></i>
                    {ev.currentRegistrations || 0} / {ev.maxCapacity || '∞'} registered
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Event Details Modal */}
      {showDetails && selectedEvent && (
        <Modal onClose={() => setShowDetails(false)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#132149] mb-4">{selectedEvent.name}</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Venue</span>
                <span className="font-semibold">{selectedEvent.venueName || selectedEvent.venue || 'TBA'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Date & Time</span>
                <span className="font-semibold">{formatDate(selectedEvent.startDateTime || selectedEvent.date)}</span>
              </div>
              {selectedEvent.endDateTime && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">End Time</span>
                  <span className="font-semibold">{formatDate(selectedEvent.endDateTime)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Capacity</span>
                <span className="font-semibold">{selectedEvent.currentRegistrations || 0} / {selectedEvent.maxCapacity || '∞'} registered</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Status</span>
                <span className="font-semibold text-green-600">{selectedEvent.status?.toUpperCase() || 'PUBLISHED'}</span>
              </div>
              {selectedEvent.eventType && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Event Type</span>
                  <span className="font-semibold">{selectedEvent.eventType}</span>
                </div>
              )}
              <div className="py-2">
                <span className="text-gray-500 block mb-2">Description</span>
                <p className="text-gray-700">{selectedEvent.description || selectedEvent.desc || 'No description available.'}</p>
              </div>
              {selectedEvent.venueAddress && (
                <div className="py-2">
                  <span className="text-gray-500 block mb-2">Venue Address</span>
                  <p className="text-gray-700">{selectedEvent.venueAddress}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowDetails(false);
                  if (!hasRsvped(selectedEvent.id)) handleRsvp(selectedEvent);
                }}
                disabled={isRsvping || hasRsvped(selectedEvent.id)}
                className={`flex-1 px-6 py-3 rounded-full font-semibold transition-all ${
                  hasRsvped(selectedEvent.id)
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'btn-primary-gradient text-white hover:shadow-lg hover:shadow-cyan-500/50'
                }`}
              >
                {hasRsvped(selectedEvent.id) ? '✅ Already RSVP\'d' : '🎯 RSVP Now'}
              </button>
              <button onClick={() => setShowDetails(false)} className="border border-gray-300 px-6 py-3 rounded-full font-semibold">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Share Modal */}
      {showShare && selectedEvent && (
        <Modal onClose={() => setShowShare(false)}>
          <h3 className="text-xl font-bold text-[#132149] mb-4">📤 Share "{selectedEvent.name}"</h3>
          <div className="space-y-3 mb-6">
            {[
              { icon: 'fa-copy', color: 'text-blue-600', bg: 'bg-blue-50', label: 'Copy Event Link', action: 'copy' },
              { icon: 'fab fa-whatsapp', color: 'text-green-600', bg: 'bg-green-50', label: 'Share via WhatsApp', action: 'whatsapp' },
              { icon: 'fab fa-twitter', color: 'text-blue-400', bg: 'bg-blue-50', label: 'Share via Twitter', action: 'twitter' },
              { icon: 'fa-envelope', color: 'text-gray-600', bg: 'bg-gray-50', label: 'Share via Email', action: 'email' }
            ].map(item => (
              <button 
                key={item.label} 
                className={`w-full flex items-center gap-3 p-3 ${item.bg} rounded-xl hover:shadow transition-all`}
                onClick={() => {
                  const url = window.location.href;
                  const message = `Check out "${selectedEvent.name}"! ${url}`;
                  
                  if (item.action === 'copy') {
                    navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard!'));
                  } else if (item.action === 'whatsapp') {
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                  } else if (item.action === 'twitter') {
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
                  } else if (item.action === 'email') {
                    window.location.href = `mailto:?subject=Check out this event&body=${encodeURIComponent(message)}`;
                  }
                }}
              >
                <i className={`fas ${item.icon} ${item.color}`}></i> {item.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowShare(false)} className="w-full border border-gray-300 px-6 py-3 rounded-full font-semibold">
            Close
          </button>
        </Modal>
      )}

      {/* Map Modal */}
      {showMap && selectedEvent && (
        <Modal onClose={() => setShowMap(false)}>
          <h3 className="text-xl font-bold text-[#132149] mb-4">📍 {selectedEvent.venueName || selectedEvent.venue}</h3>
          <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center mb-4">
            <div className="text-center">
              <i className="fas fa-map-marked-alt text-6xl text-[#02a2e0] mb-3"></i>
              <p className="text-gray-600">Map preview for {selectedEvent.venueName || selectedEvent.venue}</p>
              {selectedEvent.latitude && selectedEvent.longitude && (
                <p className="text-sm text-gray-400 mt-1">
                  Coordinates: {selectedEvent.latitude}, {selectedEvent.longitude}
                </p>
              )}
              {selectedEvent.venueAddress && (
                <p className="text-sm text-gray-400 mt-1">{selectedEvent.venueAddress}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              className="flex-1 btn-primary-gradient text-white px-4 py-2.5 rounded-full font-semibold text-sm"
              onClick={() => window.open(getGoogleMapsUrl(selectedEvent), '_blank')}
            >
              <i className="fas fa-external-link-alt mr-2"></i> Open in Maps
            </button>
            <button onClick={() => setShowMap(false)} className="flex-1 border border-gray-300 px-4 py-2.5 rounded-full font-semibold text-sm">
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Tickets/Details Modal */}
      {showTickets && selectedEvent && (
        <Modal onClose={() => setShowTickets(false)}>
          <h3 className="text-xl font-bold text-[#132149] mb-4">🎟️ Event Details - {selectedEvent.name}</h3>
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-500">Event Name</span>
                <span className="font-semibold">{selectedEvent.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-500">Date & Time</span>
                <span className="font-semibold">{formatDate(selectedEvent.startDateTime || selectedEvent.date)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-500">Venue</span>
                <span className="font-semibold">{selectedEvent.venueName || selectedEvent.venue || 'TBA'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500">Capacity</span>
                <span className="font-semibold">{selectedEvent.currentRegistrations || 0} / {selectedEvent.maxCapacity || '∞'} registered</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <h4 className="font-semibold text-[#132149] mb-2">About this event</h4>
              <p className="text-gray-600 text-sm">{selectedEvent.description || selectedEvent.desc || 'No description available.'}</p>
            </div>
            {selectedEvent.eventType && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="font-semibold text-[#132149] mb-2">Event Type</h4>
                <p className="text-gray-600 text-sm">{selectedEvent.eventType}</p>
              </div>
            )}
            {selectedEvent.customFields && selectedEvent.customFields.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="font-semibold text-[#132149] mb-2">Registration Fields</h4>
                <div className="space-y-1">
                  {selectedEvent.customFields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">{field.fieldName}:</span>
                      <span className="text-gray-400">
                        {field.fieldType} {field.isRequired && <span className="text-red-500">*</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setShowTickets(false);
                if (!hasRsvped(selectedEvent.id)) handleRsvp(selectedEvent);
              }}
              disabled={isRsvping || hasRsvped(selectedEvent.id)}
              className={`flex-1 px-6 py-3 rounded-full font-semibold transition-all ${
                hasRsvped(selectedEvent.id)
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'btn-primary-gradient text-white hover:shadow-lg hover:shadow-cyan-500/50'
              }`}
            >
              {hasRsvped(selectedEvent.id) ? '✅ Already RSVP\'d' : '🎯 RSVP Now'}
            </button>
            <button onClick={() => setShowTickets(false)} className="border border-gray-300 px-6 py-3 rounded-full font-semibold">
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Discover;