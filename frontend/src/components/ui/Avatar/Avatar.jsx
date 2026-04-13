import './Avatar.css';

export default function Avatar({
  name,
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

  const classes = `avatar avatar-${size} ${className}`.trim();

  return (
    <div className={classes}>
      <span className="avatar-content">
        {emoji || getInitials(name)}
      </span>
      {showOnline && <span className="online-dot" />}
    </div>
  );
}
