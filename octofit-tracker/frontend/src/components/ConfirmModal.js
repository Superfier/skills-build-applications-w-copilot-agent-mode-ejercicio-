import React from 'react';

const ConfirmModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Delete', confirmColor = 'danger' }) => {
  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
      <div className="modal d-block fade show" tabIndex="-1" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header">
              <h5 className="modal-title"><i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>{title || 'Confirm'}</h5>
              <button type="button" className="btn-close" onClick={onCancel} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">{message || 'Are you sure you want to proceed?'}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
              <button type="button" className={`btn btn-${confirmColor}`} onClick={onConfirm}>{confirmText}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;
