// src/pages/EventDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { apiCall, user } = useAuth();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isRsvping, setIsRsvping] = useState(false);
  const [userRsvp, setUserRsvp] = useState(null);

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        const response = await apiCall(`/api/Events/${eventId}`, 'GET');
        if (response) {
          setEvent(response);
          
          // Check if user has RSVP'd
          if (user) {
            const playerId = user?.playerId || user?.id;
            if (playerId) {
              const rsvpResponse = await apiCall(`/api/RSVP/player/${playerId}`, 'GET');
              if (Array.isArray(rsvpResponse)) {
                const userRsvp = rsvpResponse.find(r => r.eventId === parseInt(eventId));
                setUserRsvp(userRsvp);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, apiCall, user]);

  // Handle RSVP
  const handleRsvp = async () => {
    if (!user) {
      alert('Please log in to RSVP for this event.');
      return;
    }

    if (userRsvp) {
      alert('You have already RSVP\'d for this event!');
      return;
    }

    const playerId = user?.playerId || user?.id;
    if (!playerId) {
      alert('Please complete your profile to RSVP.');
      return;
    }

    setIsRsvping(true);
    try {
      const rsvpData = {
        eventId: parseInt(eventId),
        playerId: parseInt(playerId),
        status: 'Attending',
        numberOfGuests: 1,
        dietaryRequirements: '',
        specialRequests: '',
      };

      const response = await apiCall('/api/RSVP', 'POST', rsvpData);
      if (response) {
        setUserRsvp({ eventId: parseInt(eventId), status: 'Attending' });
        alert('✅ Successfully RSVP\'d for this event!');
      }
    } catch (error) {
      console.error('Error creating RSVP:', error);
      alert(`Failed to RSVP: ${error.message}`);
    } finally {
      setIsRsvping(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get Google Maps URL
  const getGoogleMapsUrl = () => {
    if (!event) return '#';
    if (event.latitude && event.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
    }
    if (event.venueAddress) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueName || '')}`;
  };

  // Share functionality
  const shareEvent = (platform) => {
    const url = window.location.href;
    const message = `Check out "${event.name}"! ${url}`;
    
    switch(platform) {
      case 'copy':
        navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard!'));
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=Check out this event&body=${encodeURIComponent(message)}`;
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <i className="fas fa-exclamation-triangle text-5xl text-red-400 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Event Not Found</h2>
          <p className="text-gray-500 mb-4">{error || 'The event you\'re looking for doesn\'t exist or has been removed.'}</p>
          <button 
            onClick={() => navigate('/discover')}
            className="btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold"
          >
            <i className="fas fa-arrow-left mr-2"></i> Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/discover')}
          className="flex items-center gap-2 text-[#02a2e0] hover:text-[#0288c7] mb-6 transition-colors"
        >
          <i className="fas fa-arrow-left"></i> Back to Events
        </button>

        {/* Main Event Card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Event Header */}
          <div className="bg-gradient-to-r from-[#132149] to-[#1a2d5e] p-6 md:p-8 text-white">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <h1 className="text-3xl md:text-4xl font-bold">{event.name}</h1>
              <span className="px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                {event.status?.toUpperCase() || 'PUBLISHED'}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-sm md:text-base text-white/80">
              <span><i className="fas fa-calendar-alt mr-2"></i>{formatDate(event.startDateTime || event.date)}</span>
              <span><i className="fas fa-map-marker-alt mr-2"></i>{event.venueName || event.venue || 'Venue TBA'}</span>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Main Info */}
              <div className="md:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h2 className="text-xl font-semibold text-[#132149] mb-3">About This Event</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {event.description || event.desc || 'No description available for this event.'}
                  </p>
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4">
                  {event.eventType && (
                    <div>
                      <p className="text-sm text-gray-500">Event Type</p>
                      <p className="font-semibold text-[#132149]">{event.eventType}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Capacity</p>
                    <p className="font-semibold text-[#132149]">
                      {event.currentRegistrations || 0} / {event.maxCapacity || '∞'} registered
                    </p>
                  </div>
                  {event.startDateTime && (
                    <div>
                      <p className="text-sm text-gray-500">Start Time</p>
                      <p className="font-semibold text-[#132149]">{formatDate(event.startDateTime)}</p>
                    </div>
                  )}
                  {event.endDateTime && (
                    <div>
                      <p className="text-sm text-gray-500">End Time</p>
                      <p className="font-semibold text-[#132149]">{formatDate(event.endDateTime)}</p>
                    </div>
                  )}
                </div>

                {/* Venue Details */}
                {(event.venueAddress || event.venueName) && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h3 className="font-semibold text-[#132149] mb-2">📍 Venue Information</h3>
                    <p className="text-gray-600">{event.venueName || event.venue}</p>
                    {event.venueAddress && <p className="text-gray-500 text-sm mt-1">{event.venueAddress}</p>}
                  </div>
                )}
              </div>

              {/* Right Column - Actions */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="font-semibold text-[#132149] mb-3">Event Actions</h3>
                  <div className="space-y-2">
                    {/* RSVP Button */}
                    <button
                      onClick={handleRsvp}
                      disabled={isRsvping || userRsvp}
                      className={`w-full px-6 py-3 rounded-full font-semibold transition-all ${
                        userRsvp
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'btn-primary-gradient text-white hover:shadow-lg hover:shadow-cyan-500/50'
                      }`}
                    >
                      {userRsvp ? (
                        <><i className="fas fa-check mr-2"></i> Already RSVP'd</>
                      ) : (
                        <><i className="fas fa-check-circle mr-2"></i> RSVP Now</>
                      )}
                    </button>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setShowShare(true)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold hover:bg-gray-50 transition-all"
                      >
                        <i className="fas fa-share-alt mr-1"></i> Share
                      </button>
                      {(event.latitude && event.longitude) && (
                        <button 
                          onClick={() => setShowMap(true)}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold hover:bg-gray-50 transition-all"
                        >
                          <i className="fas fa-map mr-1"></i> Map
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Registration Progress */}
                {event.maxCapacity && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Registration Progress</span>
                      <span className="font-semibold text-[#132149]">
                        {Math.round(((event.currentRegistrations || 0) / event.maxCapacity) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#02a2e0] h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(((event.currentRegistrations || 0) / event.maxCapacity) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {event.maxCapacity - (event.currentRegistrations || 0)} spots remaining
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#132149] mb-4">📤 Share Event</h3>
            <div className="space-y-3 mb-6">
              {[
                { icon: 'fa-copy', color: 'text-blue-600', bg: 'bg-blue-50', label: 'Copy Link', action: 'copy' },
                { icon: 'fab fa-whatsapp', color: 'text-green-600', bg: 'bg-green-50', label: 'WhatsApp', action: 'whatsapp' },
                { icon: 'fab fa-twitter', color: 'text-blue-400', bg: 'bg-blue-50', label: 'Twitter', action: 'twitter' },
                { icon: 'fa-envelope', color: 'text-gray-600', bg: 'bg-gray-50', label: 'Email', action: 'email' }
              ].map(item => (
                <button 
                  key={item.label} 
                  className={`w-full flex items-center gap-3 p-3 ${item.bg} rounded-xl hover:shadow transition-all`}
                  onClick={() => shareEvent(item.action)}
                >
                  <i className={`fas ${item.icon} ${item.color}`}></i> {item.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowShare(false)} className="w-full border border-gray-300 px-6 py-3 rounded-full font-semibold">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#132149] mb-4">📍 {event.venueName || event.venue}</h3>
            <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center mb-4">
              <div className="text-center">
                <i className="fas fa-map-marked-alt text-6xl text-[#02a2e0] mb-3"></i>
                <p className="text-gray-600">Map preview for {event.venueName || event.venue}</p>
                {event.latitude && event.longitude && (
                  <p className="text-sm text-gray-400 mt-1">
                    Coordinates: {event.latitude}, {event.longitude}
                  </p>
                )}
                {event.venueAddress && (
                  <p className="text-sm text-gray-400 mt-1">{event.venueAddress}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                className="flex-1 btn-primary-gradient text-white px-4 py-2.5 rounded-full font-semibold text-sm"
                onClick={() => window.open(getGoogleMapsUrl(), '_blank')}
              >
                <i className="fas fa-external-link-alt mr-2"></i> Open in Maps
              </button>
              <button onClick={() => setShowMap(false)} className="flex-1 border border-gray-300 px-4 py-2.5 rounded-full font-semibold text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;