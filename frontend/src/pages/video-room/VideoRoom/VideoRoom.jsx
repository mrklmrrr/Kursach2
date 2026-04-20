import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTimer } from '../../../hooks/useTimer';
import { VideoCall } from '../../../components/features';
import { Button, BackButton } from '../../../components/ui';
import PageLayout from '../../../components/layout/PageLayout/PageLayout';
import './VideoRoom.css';

export default function VideoRoom() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const consultationId = location.state?.consultationId;

  const { formatted } = useTimer(3600, () => {
    // Timer ended - 1 hour max
  });

  const handleEndCall = () => {
    navigate(-1);
  };

  if (!roomId) {
    return (
      <PageLayout hideBack>
        <div className="video-room-error">
          <p>Видео комната не найдена</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout hideBack>
      <div className="video-room-wrapper">
        <div className="video-room-header">
          <BackButton onClick={handleEndCall} label="Завершить" />
          <div className="timer">{formatted}</div>
        </div>

        <div className="video-room-content">
          <VideoCall roomId={roomId} onEndCall={handleEndCall} />
        </div>
      </div>
    </PageLayout>
  );
}
