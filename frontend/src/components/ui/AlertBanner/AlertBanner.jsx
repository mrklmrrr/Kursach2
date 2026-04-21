import './AlertBanner.css';

export default function AlertBanner({ type = 'info', message }) {
  if (!message) return null;
  const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
  return (
    <div className={`alert-banner alert-${type}`} role="status">
      <span className="material-icons" aria-hidden="true">{icon}</span>
      <p>{message}</p>
    </div>
  );
}
