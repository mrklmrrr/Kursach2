import './Avatar.css';

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

  const classes = `avatar avatar-${size} ${src ? 'avatar-has-photo' : ''} ${className}`.trim();

  return (
    <div className={classes}>
      {src ? (
        <img className="avatar-photo" src={src} alt="" />
      ) : (
        <span className="avatar-content">
          {emoji || getInitials(name)}
        </span>
      )}
      {showOnline && <span className="online-dot" />}
    </div>
  );
}
