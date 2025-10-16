import React, { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in-right ${
        type === 'success'
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'
      }`}
    >
      <div className="flex-shrink-0">
        {type === 'success' ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
    </div>
  );
};

export default Toast;
