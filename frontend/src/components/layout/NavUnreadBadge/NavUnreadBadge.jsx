import './NavUnreadBadge.css';

export default function NavUnreadBadge({ count }) {
  const value = Number(count) || 0;
  if (value <= 0) return null;

  return (
    <span className="nav-unread-badge" aria-label={`Непрочитанных: ${value}`}>
      {value > 99 ? '99+' : value}
    </span>
  );
}
