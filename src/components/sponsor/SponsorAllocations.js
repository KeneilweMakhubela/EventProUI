import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SponsorAllocations = () => {
  const { apiCall } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const response = await apiCall('/api/Sponsor/my-allocations', 'GET');
        setAllocations(response || []);
      } catch (error) {
        console.error('Error fetching allocations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllocations();
  }, [apiCall]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#132149] mb-6">My Allocations</h2>
      {allocations.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-3xl"><p className="text-gray-500">No allocations yet</p></div>
      ) : (
        <div className="space-y-4">
          {allocations.map(a => (
            <div key={a.allocationId} className="card-gradient rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-[#132149]">{a.packageName}</h3>
              <p className="text-sm text-gray-500">Status: {a.status} • Payment: {a.paymentStatus}</p>
              <p className="text-sm font-semibold text-[#02a2e0]">{Number(a.packagePrice).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SponsorAllocations;