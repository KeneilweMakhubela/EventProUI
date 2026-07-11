import React from 'react';

const Reports = () => {
  return (
    <>
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-file-export text-[#02a2e0]"></i> Reports
      </div>
      <div className="card-gradient rounded-3xl p-6 shadow-sm">
        <button className="btn-primary-gradient text-white px-6 py-3 rounded-full">
          <i className="fas fa-download mr-2"></i>Export CSV Report
        </button>
      </div>
    </>
  );
};

export default Reports;