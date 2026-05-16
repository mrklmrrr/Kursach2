import { useUsernameChange } from '@hooks/profile/useUsernameChange';
import { Input } from '../../../components/ui';

export const UsernameChangeSection = ({ embedded = false }) => {
  const { value, hint, saving, message, onChange, save } = useUsernameChange();

  const content = (
    <form className="username-change-form" onSubmit={save}>
      <div className="username-row">
        <span className="username-at" aria-hidden>
          @
        </span>
        <Input
          className="username-input"
          value={value}
          onChange={onChange}
          placeholder="новый username"
          autoComplete="username"
        />
      </div>
      {hint && (
        <p className={`username-hint ${hint === 'Свободно' ? 'ok' : hint === 'Уже занят' ? 'bad' : ''}`}>
          {hint}
        </p>
      )}
      {message.text && <p className={`password-message ${message.type}`}>{message.text}</p>}
      <button type="submit" className="btn btn-primary" disabled={saving || !value.trim()}>
        {saving ? 'Сохранение…' : 'Сохранить username'}
      </button>
    </form>
  );

  if (embedded) {
    return <div className="settings-username-content">{content}</div>;
  }

  return (
    <section className="section-card section-card--lux">
      <h3>Смена username</h3>
      {content}
    </section>
  );
};
