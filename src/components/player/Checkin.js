import React from 'react';

const Checkin = () => {
  return (
    <>
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-qrcode text-[#02a2e0]"></i> Check-in
      </div>
      <div className="card-gradient rounded-3xl p-5 shadow-sm">
        <p>Scan QR code at venue or tap below</p>
        <button className="btn-primary-gradient text-white px-5 py-2.5 rounded-full mt-3">📱 Check-in Now</button>
      </div>
    </>
  );
};

export default Checkin;