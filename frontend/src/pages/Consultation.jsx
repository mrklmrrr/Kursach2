import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import VideoCall from '../components/VideoCall';

export default function Consultation() {
  const { id: _id } = useParams();
  const [timer, setTimer] = useState('14:38');

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        let [min, sec] = prev.split(':').map(Number);
        if (sec === 0) {
          if (min === 0) return '00:00';
          return `${min-1}:59`;
        }
        return `${min}:${sec-1 < 10 ? '0'+(sec-1) : sec-1}`;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="consultation-screen">
      <div className="consultation-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <span className="material-icons">arrow_back</span> Назад
        </button>
        <div>👩‍⚕️ Анна Иванова · педиатр</div>
        <div className="timer">{timer}</div>
      </div>
      <div style={{ height: 'calc(100vh - 140px)' }}>
        <VideoCall />
      </div>
      <div className="controls-bar">
        <button className="control-btn end-call" onClick={() => window.history.back()}>
          <span className="material-icons">call_end</span> Завершить
        </button>
      </div>
    </div>
  );
}