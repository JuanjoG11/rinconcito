import { useState, useCallback } from 'react';

let _addToast = null;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'default') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  _addToast = addToast;

  return { toasts, addToast };
}

export function toast(msg, type = 'default') {
  if (_addToast) _addToast(msg, type);
}

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}
