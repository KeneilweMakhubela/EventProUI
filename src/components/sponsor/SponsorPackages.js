import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SponsorPackages = () => {
  const { apiCall } = useAuth();
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await apiCall('/api/Sponsor/packages', 'GET');
        setPackages(response || []);
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, [apiCall]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-[#02a2e0] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#132149] mb-6">Available Packages</h2>
      <div className="grid grid-cols-2 gap-4">
        {packages.length === 0 ? (
          <div className="col-span-2 text-center py-8 bg-gray-50 rounded-3xl"><p className="text-gray-500">No packages available</p></div>
        ) : (
          packages.filter(p => p.isActive).map(pkg => (
            <div key={pkg.packageId} className="card-gradient rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-[#132149]">{pkg.packageName}</h3>
              <p className="text-sm text-gray-500">{pkg.description}</p>
              <p className="text-lg font-bold text-[#02a2e0]">R{Number(pkg.price).toLocaleString()}</p>
              <button className="mt-3 btn-primary-gradient text-white px-4 py-2 rounded-full text-sm font-semibold">Request Package</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SponsorPackages;