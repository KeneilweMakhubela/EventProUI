import React from 'react';

const Modal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-white rounded-[28px] p-8 max-w-lg w-[90%] max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Modal;