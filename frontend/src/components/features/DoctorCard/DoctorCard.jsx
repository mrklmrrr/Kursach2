import { useNavigate } from 'react-router-dom';
import Avatar from '../../ui/Avatar/Avatar';
import { formatCurrency } from '../../../utils/helpers';
import './DoctorCard.css';

export default function DoctorCard({ doctor, variant = 'compact' }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/doctor/${doctor.id}`);
  };

  if (variant === 'compact') {
    return (
      <div className="doctor-card-compact" onClick={handleClick}>
        <div className="doctor-avatar-wrapper">
          <Avatar name={doctor.name} size="medium" showOnline={doctor.isOnline} />
          {doctor.isOnline && <div className="online-dot" />}
        </div>
        <div className="doctor-name">{doctor.name}</div>
        <div className="doctor-spec">{doctor.specialty}</div>
      </div>
    );
  }

  return (
    <div className="doctor-card-full" onClick={handleClick}>
      <div className="doctor-left">
        <Avatar name={doctor.name} size="medium" showOnline={doctor.isOnline} />
        <div>
          <div className="doctor-name">{doctor.name}</div>
          <div className="doctor-spec">{doctor.specialty}</div>
        </div>
      </div>
      <div className="doctor-right">
        {doctor.isOnline && <span className="online-badge">Онлайн</span>}
        <div className="price">{formatCurrency(doctor.price)}</div>
        <button className="small-btn" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
          Подробнее
        </button>
      </div>
    </div>
  );
}
