import { useState } from 'react';
import { Button } from '../../../components/ui';
import { RELATION_TYPES } from '../../../constants';
import { dependentApi } from '../../../services/dependentApi';
import { useToast } from '../../../contexts/ToastProvider/useToast';

function relationLabel(value) {
  return RELATION_TYPES.find((r) => r.value === value)?.label || value;
}

export default function RelativeInviteSection({ invites, onChanged }) {
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState(null);

  if (!invites?.length) return null;

  const handleAccept = async (invite) => {
    setBusyId(invite.id);
    try {
      await dependentApi.acceptInvite(invite.id);
      showToast('Родственная связь подтверждена', 'success');
      await onChanged?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Не удалось подтвердить', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (invite) => {
    setBusyId(invite.id);
    try {
      await dependentApi.rejectInvite(invite.id);
      showToast('Приглашение отклонено', 'info');
      await onChanged?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Не удалось отклонить', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="relative-invites-section" aria-label="Приглашения в родственники">
      {invites.map((invite) => {
        const rel = relationLabel(invite.relation);
        const who = invite.fromName || invite.fromUsername || 'Пользователь';
        const at = invite.fromUsername ? `@${invite.fromUsername}` : '';
        const busy = busyId === invite.id;

        return (
          <article key={invite.id} className="relative-invite-card">
            <div className="relative-invite-icon" aria-hidden>
              <span className="material-icons">family_restroom</span>
            </div>
            <div className="relative-invite-body">
              <h3 className="relative-invite-title">Запрос на добавление в родственники</h3>
              <p className="relative-invite-text">
                <strong>{who}</strong>
                {at ? ` (${at})` : ''} хочет добавить вас как <strong>{rel.toLowerCase()}</strong>.
              </p>
              <p className="relative-invite-question">Является ли этот человек вашим родственником?</p>
              {invite.notes ? <p className="relative-invite-note">Заметка: {invite.notes}</p> : null}
              <div className="relative-invite-actions">
                <Button
                  type="button"
                  variant="primary"
                  size="small"
                  disabled={busy}
                  onClick={() => handleAccept(invite)}
                >
                  {busy ? '…' : 'Да, подтвердить'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="small"
                  disabled={busy}
                  onClick={() => handleReject(invite)}
                >
                  Отклонить
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
