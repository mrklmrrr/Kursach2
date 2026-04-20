import { useAuth } from '../../../hooks/useAuth';
import { AppHeader, BottomNav } from '../../../components/layout';
import { useConsultationHistory } from '../hooks/useConsultationHistory';
import { useMedicalRecord } from '../hooks/useMedicalRecord';
import { ProfileHeader } from '../components/ProfileHeader';
import { MedicalCardSection } from '../components/MedicalCardSection';
import { ConsultationHistorySection } from '../components/ConsultationHistorySection';
import { PasswordChangeSection } from '../components/PasswordChangeSection';
import { SettingsSection } from '../components/SettingsSection';

import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const { historyItems, loading: consultationsLoading, error: consultationsError } = useConsultationHistory(user);
  const {
    medicalRecord,
    loading: medicalRecordLoading,
    error: medicalRecordError,
    allLeaves,
    currentLeaf
  } = useMedicalRecord(user);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="profile-page">
      <AppHeader />
      <div className="profile-content">
        <ProfileHeader user={user} />

        {user?.role !== 'doctor' && (
          <>
            <section className="section-card">
              <h3>Мои родственники</h3>
              <p className="empty-info">Родственники пока не добавлены.</p>
            </section>

            <MedicalCardSection
              medicalRecord={medicalRecord}
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
          </>
        )}

        <PasswordChangeSection />

        <SettingsSection onLogout={handleLogout} />
      </div>
      <BottomNav />
    </div>
  );
}