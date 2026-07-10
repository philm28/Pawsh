import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col gap-2 px-4 pointer-events-none md:bottom-4 md:left-auto md:right-4 md:max-w-sm md:w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto animate-in slide-in-from-bottom-2 duration-200 ${
            t.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : t.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {t.type === 'success' ? (
              <CheckCircle size={16} />
            ) : t.type === 'error' ? (
              <AlertCircle size={16} />
            ) : (
              <Info size={16} />
            )}
          </div>
          <p className="flex-1 text-sm font-medium">{t.message}</p>
          <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
