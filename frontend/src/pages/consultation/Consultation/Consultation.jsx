import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTimer } from '../../../hooks/useTimer';
import { VideoCall } from '../../../components/features';
import { Button, BackButton } from '../../../components/ui';
import { Avatar } from '../../../components/ui';
import { videoRoomApi } from '../../../services';
import './Consultation.css';

export default function Consultation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const doctorFromState = location.state?.doctor;

  const [consultation, setConsultation] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [loading, setLoading] = useState(true);

  const { formatted, reset } = useTimer(900, () => {
    // Timer ended
  });

  useEffect(() => {
    const consultationData = doctorFromState
      ? {
          id: parseInt(id),
          doctorName: doctorFromState.name,
          specialty: doctorFromState.specialty,
          avatar: doctorFromState.avatar || '👩‍⚕️',
        }
      : {
          id: parseInt(id),
          doctorName: 'Врач',
          specialty: 'Специалист',
          avatar: '👩‍⚕️',
        };

    setConsultation(consultationData);
  }, [id, doctorFromState]);

  // Auto-join video room for patient
  useEffect(() => {
    const joinVideoRoom = async () => {
      try {
        setLoading(true);
        const room = await videoRoomApi.getRoomInfo(id);
        setRoomId(room._id || id);
      } catch (err) {
        console.error('Error joining video room:', err);
        // If room doesn't exist, create it (for doctor)
        try {
          const newRoom = await videoRoomApi.createRoom(id);
          setRoomId(newRoom._id || id);
        } catch (createErr) {
          console.error('Error creating video room:', createErr);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      joinVideoRoom();
    }
  }, [id]);

  const endConsultation = () => {
    setTimeout(() => navigate('/chats'), 600);
  };

  if (!consultation || loading) {
    return (
      <div className="loading-screen">
        <div className="loader-spinner" />
        <p>Загрузка консультации...</p>
      </div>
    );
  }

  return (
    <div className="consultation-screen">
      <div className="consultation-header">
        <BackButton onClick={endConsultation} label="Завершить" />
        <div className="doctor-info-header">
          <Avatar name={consultation.doctorName} emoji={consultation.avatar} size="small" />
          <div>
            <div className="doctor-name-header">{consultation.doctorName}</div>
            <div className="doctor-spec-header">{consultation.specialty}</div>
          </div>
        </div>
        <div className="timer">{formatted}</div>
      </div>

      <div className="video-call-wrapper">
        {roomId && <VideoCall roomId={roomId} onEndCall={endConsultation} />}
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
