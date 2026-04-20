export default function ProfileHeader({ profile, isOnline, onToggleOnline }) {
  return (
    <div className="profile-header">
      <div className="profile-main">
        <h2>{profile?.firstName} {profile?.lastName}</h2>
        <p className="profile-specialty">{profile?.specialty}</p>
      </div>
      <button
        className={`online-toggle ${isOnline ? 'online' : 'offline'}`}
        onClick={onToggleOnline}
      >
        {isOnline ? '🟢 Онлайн' : '⚫ Оффлайн'}
      </button>
    </div>
  );
}
