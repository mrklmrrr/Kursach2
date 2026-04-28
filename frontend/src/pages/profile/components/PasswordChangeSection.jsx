import { usePasswordChange } from '@hooks/profile';

export const PasswordChangeSection = () => {
  const {
    passwordForm,
    saving,
    message,
    handlePasswordChange,
    handleChangePassword
  } = usePasswordChange();

  return (
    <section className="section-card section-card--lux">
      <h3>Смена пароля</h3>
      <form className="password-form" onSubmit={handleChangePassword}>
        <input
          type="password"
          name="currentPassword"
          value={passwordForm.currentPassword}
          onChange={handlePasswordChange}
          placeholder="Текущий пароль"
        />
        <input
          type="password"
          name="newPassword"
          value={passwordForm.newPassword}
          onChange={handlePasswordChange}
          placeholder="Новый пароль"
        />
        <input
          type="password"
          name="confirmPassword"
          value={passwordForm.confirmPassword}
          onChange={handlePasswordChange}
          placeholder="Подтвердите новый пароль"
        />
        {message.text && (
          <p className={`password-message ${message.type}`}>{message.text}</p>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Сохранение...' : 'Изменить пароль'}
        </button>
      </form>
    </section>
  );
};