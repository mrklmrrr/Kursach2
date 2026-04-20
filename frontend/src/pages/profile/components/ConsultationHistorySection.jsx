import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { formatHistoryDate, formatPrice, getDoctorInfo, getConsultationTimeline } from '../utils/profileUtils';

export const ConsultationHistorySection = ({ historyItems, loading, error }) => {
  const navigate = useNavigate();
  const [paymentTab, setPaymentTab] = useState('history');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const handlePayAppointment = (item) => {
    const appointmentId = item?.rawAppointment?._id;
    if (!appointmentId) return;
    navigate(ROUTES.PAYMENT, {
      state: {
        appointment: {
          id: appointmentId,
          date: item.rawAppointment?.date,
          time: item.rawAppointment?.time,
          consultationType: item.rawAppointment?.consultationType,
          duration: item.rawAppointment?.duration,
          amount: Number(item.rawAppointment?.paymentAmount || item.price || 0),
          doctorName: item.rawAppointment?.doctorName
        }
      }
    });
  };

  return (
    <section className="section-card">
      <h3>История консультаций</h3>
      <div className="profile-tabs">
        <button
          type="button"
          className={`profile-tab-btn ${paymentTab === 'history' ? 'active' : ''}`}
          onClick={() => setPaymentTab('history')}
        >
          История
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${paymentTab === 'payments' ? 'active' : ''}`}
          onClick={() => setPaymentTab('payments')}
        >
          Оплата
        </button>
      </div>
      {loading && <p className="empty-info">Загрузка истории...</p>}
      {!loading && error && <p className="error-info">{error}</p>}
      {!loading && !error && paymentTab === 'history' && historyItems.length === 0 && (
        <p className="empty-info">История консультаций пока пуста.</p>
      )}
      {!loading && !error && paymentTab === 'history' && historyItems.length > 0 && (
        (historyOpen ? historyItems : historyItems.slice(0, 3)).map((item) => {
          const doctorInfo = getDoctorInfo(item);
          return (
          <div
            key={item.id}
            className="history-item"
            onDoubleClick={() => setSelectedHistoryItem(item)}
          >
            <div className="history-item-main">
              <div>{formatHistoryDate(item.date)} • {item.specialty || 'Консультация'} • {item.duration || 0} мин</div>
              <div className="history-item-doctor">Врач: {doctorInfo.doctorName} • {doctorInfo.doctorProfession}</div>
              {item.price > 0 ? <div className="history-item-price">{formatPrice(item.price)}</div> : null}
            </div>
            <span className={`history-tag ${getConsultationTimeline(item).key}`}>
              {getConsultationTimeline(item).label}
            </span>
          </div>
          );
        })
      )}
      {!loading && !error && paymentTab === 'history' && historyItems.length > 0 && (
        <button className="btn btn-outline" onClick={() => setHistoryOpen((prev) => !prev)}>
          {historyOpen ? 'Скрыть историю консультаций' : 'Открыть историю консультаций'}
        </button>
      )}
      {!loading && !error && paymentTab === 'payments' && (
        <>
          {historyItems.filter((item) => item.source === 'appointment').length === 0 ? (
            <p className="empty-info">Оплачивать пока нечего. Записи на прием не найдены.</p>
          ) : (
            historyItems
              .filter((item) => item.source === 'appointment')
              .map((item) => {
                const paid = item.rawAppointment?.paymentStatus === 'paid';
                return (
                  <div key={`pay-${item.id}`} className="history-item payment-item">
                    <div className="history-item-main">
                      {formatHistoryDate(item.date)} • {item.specialty || 'Консультация'} • {item.duration || 0} мин
                      <br />
                      <span className="payment-price">К оплате: {formatPrice(item.price)}</span>
                    </div>
                    <div className="payment-actions">
                      <span className={`history-tag ${paid ? 'paid' : 'unpaid'}`}>
                        {paid ? 'Оплачен' : 'Не оплачен'}
                      </span>
                      {!paid && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handlePayAppointment(item)}
                        >
                          Оплатить прием
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </>
      )}

      {selectedHistoryItem && (
        <HistoryItemModal
          item={selectedHistoryItem}
          onClose={() => setSelectedHistoryItem(null)}
        />
      )}
    </section>
  );
};