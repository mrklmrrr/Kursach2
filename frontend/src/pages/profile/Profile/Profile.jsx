import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useIsDesktop } from '@hooks/useIsDesktop';
import { AppHeader, BottomNav, UserSidebar } from '@components/layout';
import { Card } from '@components/ui';
import DoctorSidebar from '@pages/doctorPanel/components/DoctorSidebar/DoctorSidebar';
import { useConsultationHistory, useMedicalRecord } from '@hooks/profile';
import { dependentApi } from '@services/dependentApi';
import { RELATION_TYPES, ROUTES } from '@constants';
import RelativeInviteSection from '../components/RelativeInviteSection';
import { ProfileHeader } from '../components/ProfileHeader';
import { MedicalCardSection } from '../components/MedicalCardSection';
import { ConsultationHistorySection } from '../components/ConsultationHistorySection';
import { SettingsSection } from '../components/SettingsSection';
import ReminderSection from '../components/ReminderSection';
import UsernameSection from '../components/UsernameSection';

import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [dependents, setDependents] = useState([]);
  const [dependentsLoading, setDependentsLoading] = useState(false);
  const [incomingInvites, setIncomingInvites] = useState([]);

  const relationLabel = (value) => RELATION_TYPES.find((r) => r.value === value)?.label || value;

  const loadRelativesData = useCallback(async () => {
    setDependentsLoading(true);
    try {
      const [depsRes, invitesRes] = await Promise.all([
        dependentApi.getAll(),
        dependentApi.getIncomingInvites()
      ]);
      setDependents(depsRes.data || []);
      setIncomingInvites(invitesRes.data || []);
    } catch {
      setDependents([]);
      setIncomingInvites([]);
    } finally {
      setDependentsLoading(false);
    }
  }, []);
  const { historyItems, loading: consultationsLoading, error: consultationsError } = useConsultationHistory(user);
  const {
    medicalRecord,
    laboratoryResults,
    instrumentalResults,
    loading: medicalRecordLoading,
    error: medicalRecordError,
    allLeaves,
    currentLeaf
  } = useMedicalRecord(user);

  const handleLogout = () => {
    logout();
  };

  /* eslint-disable react-hooks/set-state-in-effect -- controlled fetch cycle for dependents with loading/error reset */
  useEffect(() => {
    if (!user || user.role === 'doctor') {
      setDependents([]);
      setIncomingInvites([]);
      setDependentsLoading(false);
      return;
    }
    loadRelativesData();
  }, [user, loadRelativesData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isDoctor = user?.role === 'doctor';

  return (
    <div className={`profile-page ${isDoctor ? 'doctor-panel-page' : 'user-panel-page'}`}>
      {isDoctor && <DoctorSidebar profile={user} />}
      {!isDoctor && <UserSidebar />}
      <AppHeader />
      <div className="profile-content page-shell page-shell--flex-grow">
        <ProfileHeader user={user} />

        {user?.role !== 'doctor' && (
          <>
            <RelativeInviteSection invites={incomingInvites} onChanged={loadRelativesData} />

            <Card>
              <Card.Header>
                <Card.Title>Мои родственники</Card.Title>
              </Card.Header>
              <Card.Body>
                {dependentsLoading ? (
                  <p className="empty-info">Загрузка списка родственников...</p>
                ) : dependents.length > 0 ? (
                  <ul className="profile-simple-list">
                    {dependents.map((item) => (
                      <li key={item.id || item._id} className="profile-relative-item">
                        <span className="profile-relative-name">{item.fullName || item.name}</span>
                        {item.relation ? (
                          <span className="profile-relative-relation">{relationLabel(item.relation)}</span>
                        ) : null}
                        {item.linkedUsername ? (
                          <span className="profile-relative-username">@{item.linkedUsername}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-info">Родственники пока не добавлены.</p>
                )}
              </Card.Body>
              <Card.Footer>
                <button
                  type="button"
                  className="btn btn-outline btn-small add-relative-btn"
                  onClick={() => navigate('/profile/add-relative')}
                >
                  Добавить родственника
                </button>
              </Card.Footer>
            </Card>

            {isDesktop ? (
              <Card>
                <Card.Header>
                  <Card.Title>Медицинская карта</Card.Title>
                </Card.Header>
                <Card.Body>
                  <p className="empty-info">
                    Записи врача, лабораторные и инструментальные исследования, больничные листы и назначения.
                  </p>
                </Card.Body>
                <Card.Footer>
                  <button
                    type="button"
                    className="btn btn-outline btn-small add-relative-btn"
                    onClick={() => navigate(ROUTES.MEDICAL_CARD)}
                  >
                    Открыть медкарту
                  </button>
                </Card.Footer>
              </Card>
            ) : (
              <MedicalCardSection
                medicalRecord={medicalRecord}
                laboratoryResults={laboratoryResults}
                instrumentalResults={instrumentalResults}
                loading={medicalRecordLoading}
                error={medicalRecordError}
                allLeaves={allLeaves}
                currentLeaf={currentLeaf}
              />
            )}

            <ConsultationHistorySection
              historyItems={historyItems}
              loading={consultationsLoading}
              error={consultationsError}
            />

            <UsernameSection />
            <ReminderSection />
          </>
        )}

        <SettingsSection onLogout={handleLogout} />
      </div>
      <BottomNav />
    </div>
  );
}
