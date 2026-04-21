import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { AppHeader, BottomNav } from '../../../components/layout';
import { useConsultationHistory } from '../hooks/useConsultationHistory';
import { useMedicalRecord } from '../hooks/useMedicalRecord';
import { dependentApi } from '../../../services/dependentApi';
import { ProfileHeader } from '../components/ProfileHeader';
import { MedicalCardSection } from '../components/MedicalCardSection';
import { ConsultationHistorySection } from '../components/ConsultationHistorySection';
import { PasswordChangeSection } from '../components/PasswordChangeSection';
import { SettingsSection } from '../components/SettingsSection';
import ReminderSection from '../components/ReminderSection';
import UsernameSection from '../components/UsernameSection';

import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dependents, setDependents] = useState([]);
  const [dependentsLoading, setDependentsLoading] = useState(false);
  const { historyItems, loading: consultationsLoading, error: consultationsError } = useConsultationHistory(user);
  const {
    medicalRecord,
    laboratoryResults,
    loading: medicalRecordLoading,
    error: medicalRecordError,
    allLeaves,
    currentLeaf
  } = useMedicalRecord(user);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (!user || user.role === 'doctor') {
      setDependents([]);
      setDependentsLoading(false);
      return;
    }
    setDependentsLoading(true);
    dependentApi
      .getAll()
      .then((res) => setDependents(res.data || []))
      .catch(() => setDependents([]))
      .finally(() => setDependentsLoading(false));
  }, [user]);

  return (
    <div className="profile-page">
      <AppHeader />
      <div className="profile-content page-shell page-shell--flex-grow">
        <ProfileHeader user={user} />

        {user?.role !== 'doctor' && (
          <>
            <section className="section-card">
              <h3>Мои родственники</h3>
              {dependentsLoading ? (
                <p className="empty-info">Загрузка списка родственников...</p>
              ) : dependents.length > 0 ? (
                <ul className="profile-simple-list">
                  {dependents.map((item) => (
                    <li key={item.id || item._id}>
                      {item.fullName || item.name} {item.relation ? `(${item.relation})` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-info">Родственники пока не добавлены.</p>
              )}
              <button type="button" className="btn btn-outline btn-small" onClick={() => navigate('/profile/add-relative')}>
                Добавить родственника
              </button>
            </section>

            <MedicalCardSection
              medicalRecord={medicalRecord}
              laboratoryResults={laboratoryResults}
              loading={medicalRecordLoading}
              error={medicalRecordError}
              allLeaves={allLeaves}
              currentLeaf={currentLeaf}
            />

            <ConsultationHistorySection
              historyItems={historyItems}
              loading={consultationsLoading}
              error={consultationsError}
            />

            <UsernameSection />
            <ReminderSection />
          </>
        )}

        <PasswordChangeSection />

        <SettingsSection onLogout={handleLogout} />
      </div>
      <BottomNav />
    </div>
  );
}