import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast show align-items-center text-white bg-${toast.type === 'error' ? 'danger' : toast.type} border-0`}
            role="alert"
          >
            <div className="d-flex">
              <div className="toast-body">
                <i className={`bi ${toast.type === 'error' ? 'bi-exclamation-circle-fill' : toast.type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2`}></i>
                {toast.message}
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => removeToast(toast.id)} aria-label="Close"></button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
