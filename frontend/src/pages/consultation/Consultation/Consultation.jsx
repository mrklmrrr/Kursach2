import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useTimer } from '../../../hooks/useTimer';
import { VideoCall } from '../../../components/features';
import { Button, BackButton } from '../../../components/ui';
import { Avatar } from '../../../components/ui';
import './Consultation.css';

export default function Consultation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const doctorFromState = location.state?.doctor;

  const consultation = useMemo(() => {
    return doctorFromState
      ? {
          id: parseInt(id, 10),
          doctorName: doctorFromState.name,
          specialty: doctorFromState.specialty,
          avatarUrl: doctorFromState.avatarUrl || doctorFromState.avatar || '',
        }
      : {
          id: parseInt(id, 10),
          doctorName: 'Врач',
          specialty: 'Специалист',
          avatarUrl: '',
        };
  }, [id, doctorFromState]);

  const { formatted } = useTimer(900, () => {
    // Timer ended
  });

  const endConsultation = () => {
    setTimeout(() => navigate('/chats'), 600);
  };

  return (
    <div className="consultation-screen">
      <div className="consultation-header">
        <BackButton onClick={endConsultation} label="Завершить" />
        <div className="doctor-info-header">
          <Avatar name={consultation.doctorName} src={consultation.avatarUrl || undefined} size="small" />
          <div>
            <div className="doctor-name-header">{consultation.doctorName}</div>
            <div className="doctor-spec-header">{consultation.specialty}</div>
          </div>
        </div>
        <div className="timer-pill" aria-label="Оставшееся время консультации">
          <span className="timer-label">Осталось</span>
          <span className="timer-value">{formatted}</span>
        </div>
      </div>

      <div className="video-call-wrapper">
        <VideoCall />
      </div>

      <div className="controls-bar">
        <Button variant="danger" size="medium" onClick={endConsultation}>
          <span className="material-icons">call_end</span>
          Завершить звонок
        </Button>
      </div>
    </div>
  );
}
