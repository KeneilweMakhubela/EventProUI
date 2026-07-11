import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SponsorRSVPs = () => {
  const { apiCall } = useAuth();
  const [rsvps, setRsvps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRSVPs = async () => {
      try {
        const response = await apiCall('/api/Sponsor/my-rsvps', 'GET');
        setRsvps(response || []);
      } catch (error) {
        console.error('Error fetching RSVPs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRSVPs();
  }, [apiCall]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#132149] mb-6">My RSVPs</h2>
      {rsvps.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-3xl"><p className="text-gray-500">No RSVPs yet</p></div>
      ) : (
        <div className="space-y-4">
          {rsvps.map(r => (
            <div key={r.rsvpId} className="card-gradient rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-[#132149]">{r.eventName}</h3>
              <p className="text-sm text-gray-500">Status: {r.status} • {r.attendeesCount} attendees</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SponsorRSVPs;