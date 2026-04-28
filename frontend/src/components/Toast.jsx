import { CheckCircle, XCircle } from 'lucide-react';

export default function Toast({ message, type = 'success' }) {
  return (
    <div className="toast-wrap">
      <div className={`toast ${type}`}>
        {type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
        {message}
      </div>
    </div>
  );
}
