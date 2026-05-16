export default function ProfileHeader({ profile, isAvailable, onToggleOnline }) {
  return (
    <div className="profile-header">
      <div className="profile-main">
        <h2>{profile?.firstName} {profile?.lastName}</h2>
        <p className="profile-specialty">{profile?.specialty}</p>
      </div>
      <button
        type="button"
        className={`online-toggle ${isAvailable ? 'online' : 'offline'}`}
        onClick={onToggleOnline}
      >
        {isAvailable ? '🟢 Доступен' : '⚫ Недоступен'}
      </button>
    </div>
  );
}
