import { useNavigate } from 'react-router-dom';
import Avatar from '../../ui/Avatar/Avatar';
import { formatCurrency } from '../../../utils/helpers';
import './ConsultationCard.css';

export default function ConsultationCard({ consultation }) {
  const navigate = useNavigate();

  return (
    <div
      className="consultation-card"
      onClick={() => navigate(`/consultation/${consultation.id}`)}
    >
      <Avatar name={consultation.doctorName} size="medium" />
      <div className="consultation-info">
        <div className="consultation-doctor">{consultation.doctorName}</div>
        <div className="consultation-spec">{consultation.specialty}</div>
        <div className="consultation-time">{consultation.time}</div>
      </div>
      {consultation.price && (
        <div className="consultation-price">{formatCurrency(consultation.price)}</div>
      )}
    </div>
  );
}
