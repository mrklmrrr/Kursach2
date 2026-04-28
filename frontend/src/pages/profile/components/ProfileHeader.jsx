import { useRef, useState } from 'react';
import { Avatar } from '../../../components/ui';
import { authApi } from '../../../services/authApi';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../contexts/ToastProvider/useToast';

export const ProfileHeader = ({ user }) => {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.name || 'Пользователь';
  const avatarSrc = user?.avatarUrl || '';

  const pickPhoto = () => {
    inputRef.current?.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await authApi.uploadAvatar(fd);
      await refreshUser();
      showToast('Фото профиля обновлено', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Не удалось загрузить фото', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-header">
      <button
        type="button"
        className="profile-avatar-btn"
        onClick={pickPhoto}
        disabled={uploading}
        aria-label="Загрузить фото профиля"
      >
        <Avatar name={fullName} src={avatarSrc || undefined} size="xlarge" />
        <span className="profile-avatar-edit">
          {uploading ? '…' : 'Фото'}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="profile-avatar-input"
        onChange={onFile}
        tabIndex={-1}
        aria-hidden
      />
      <h1>{fullName}</h1>
      {user?.role === 'patient' && user?.username ? (
        <p className="profile-username-display">@{user.username}</p>
      ) : null}
      <p className="profile-email">{user?.email || user?.phone || ''}</p>
    </div>
  );
};
