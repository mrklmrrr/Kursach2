import { Avatar } from '../../../components/ui';

export const ProfileHeader = ({ user }) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.name || 'Пользователь';

  return (
    <div className="profile-header">
      <Avatar name={fullName} size="xlarge" />
      <h1>{fullName}</h1>
      <p className="profile-email">{user?.email || ''}</p>
    </div>
  );
};