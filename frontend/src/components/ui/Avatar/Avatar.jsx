import './Avatar.css';

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function getApiOrigin() {
  const fallbackOrigin = window.location.origin;
  const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();

  if (!rawApiUrl) return fallbackOrigin;

  if (/^https?:\/\//i.test(rawApiUrl)) {
    try {
      return new URL(rawApiUrl).origin;
    } catch {
      return fallbackOrigin;
    }
  }

  return fallbackOrigin;
}

function normalizeAvatarSrc(src) {
  if (!src) return src;
  const value = String(src).trim();
  if (!value) return '';
  if (/^(data:|blob:)/i.test(value)) return value;

  const apiOrigin = getApiOrigin();

  if (/^https?:\/\//i.test(value)) {
    try {
      const original = new URL(value);
      const currentHost = window.location.hostname;
      if (isLocalHost(original.hostname) && !isLocalHost(currentHost)) {
        return `${apiOrigin}${original.pathname}${original.search}${original.hash}`;
      }
    } catch {
      return value;
    }
    return value;
  }

  return `${apiOrigin}${value.startsWith('/') ? value : `/${value}`}`;
}

export default function Avatar({
  name,
  src,
  emoji,
  size = 'medium',
  showOnline = false,
  className = '',
}) {
  const getInitials = (fullName) => {
    if (!fullName) return 'А';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const normalizedSrc = normalizeAvatarSrc(src);
  const classes = `avatar avatar-${size} ${normalizedSrc ? 'avatar-has-photo' : ''} ${className}`.trim();

  return (
    <div className={classes}>
      {normalizedSrc ? (
        <img className="avatar-photo" src={normalizedSrc} alt="" />
      ) : (
        <span className="avatar-content">
          {emoji || getInitials(name)}
        </span>
      )}
      {showOnline && <span className="online-dot" />}
    </div>
  );
}
