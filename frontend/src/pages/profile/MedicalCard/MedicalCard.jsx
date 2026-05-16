import { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useMedicalRecord } from '@hooks/profile';
import { ROUTES } from '@constants';
import { AppHeader, BottomNav, UserSidebar } from '@components/layout';
import { Card } from '@components/ui';
import { MedicalCardSection } from '../components/MedicalCardSection';
import '../Profile/Profile.css';
import './MedicalCard.css';

const VALID_TABS = ['systems', 'sickLeave', 'laboratory', 'instrumental', 'prescriptions'];

export default function MedicalCardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'systems';

  const {
    medicalRecord,
    laboratoryResults,
    instrumentalResults,
    loading,
    error,
    allLeaves,
    currentLeaf
  } = useMedicalRecord(user);

  useEffect(() => {
    if (tabParam && !VALID_TABS.includes(tabParam)) {
      setSearchParams({ tab: 'systems' }, { replace: true });
    }
  }, [tabParam, setSearchParams]);

  if (user?.role === 'doctor') {
    return <Navigate to={ROUTES.PROFILE} replace />;
  }

  const patientName =
    medicalRecord?.patient?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    'Пациент';
  const birthYear = medicalRecord?.patient?.birthDate
    ? String(medicalRecord.patient.birthDate).slice(0, 4)
    : user?.birthDate
      ? String(user.birthDate).slice(0, 4)
      : null;

  const handleTabChange = (tab) => {
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <div className="medical-card-page user-panel-page">
      <UserSidebar />
      <AppHeader showBack backTo={ROUTES.PROFILE} title="Медицинская карта" />
      <div className="medical-card-inner page-shell page-shell--flex-grow">
        <header className="medical-card-page-header">
          <h1 className="medical-card-title lux-heading">Медицинская карта</h1>
          <p className="medical-card-lead">
            Записи врача, результаты исследований, больничные листы и назначения — всё в одном месте.
          </p>
        </header>

        <Card className="medical-card-patient-card">
          <Card.Body>
            <div className="medical-card-patient-row">
              <div>
                <p className="medical-card-patient-label">Пациент</p>
                <p className="medical-card-patient-name">{patientName}</p>
              </div>
              {birthYear ? (
                <div className="medical-card-patient-meta">
                  <span className="medical-card-patient-label">Год рождения</span>
                  <span>{birthYear}</span>
                </div>
              ) : null}
              {medicalRecord?.patient?.phone || user?.phone ? (
                <div className="medical-card-patient-meta">
                  <span className="medical-card-patient-label">Телефон</span>
                  <span>{medicalRecord?.patient?.phone || user?.phone}</span>
                </div>
              ) : null}
            </div>
          </Card.Body>
        </Card>

        <MedicalCardSection
          variant="page"
          initialTab={activeTab}
          onTabChange={handleTabChange}
          medicalRecord={medicalRecord}
          laboratoryResults={laboratoryResults}
          instrumentalResults={instrumentalResults}
          loading={loading}
          error={error}
          allLeaves={allLeaves}
          currentLeaf={currentLeaf}
        />
      </div>
      <BottomNav />
    </div>
  );
}
