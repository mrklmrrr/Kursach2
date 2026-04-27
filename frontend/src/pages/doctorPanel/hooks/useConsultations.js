import { useState } from 'react';
import { doctorPanelApi } from '../../../services/doctorPanelApi';
import { appointmentApi } from '../../../services/appointmentApi';

export const useConsultations = () => {
  const [pendingConsultations, setPendingConsultations] = useState([]);

  const handleAccept = async (id) => {
    try {
      await doctorPanelApi.acceptConsultation(id);
      setPendingConsultations(prev => prev.filter(c => c._id !== id));
      return true;
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка');
      return false;
    }
  };

  const handleReject = async (id) => {
    try {
      await doctorPanelApi.rejectConsultation(id);
      setPendingConsultations(prev => prev.filter(c => c._id !== id));
      return true;
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка');
      return false;
    }
  };

  return {
    pendingConsultations,
    setPendingConsultations,
    handleAccept,
    handleReject
  };
};

export const useCommentModal = () => {
  const [modal, setModal] = useState({
    open: false,
    appointment: null,
    text: ''
  });

  const openModal = (appointment) => {
    setModal({
      open: true,
      appointment,
      text: appointment.doctorComment || ''
    });
  };

  const closeModal = () => {
    setModal({
      open: false,
      appointment: null,
      text: ''
    });
  };

  const save = async (appointments, setAppointments) => {
    if (!modal.appointment?._id) {
      closeModal();
      return;
    }
    try {
      const { data } = await appointmentApi.updateDoctorComment(
        modal.appointment._id,
        modal.text
      );
      setAppointments(prev => prev.map(a => (a._id === data._id ? data : a)));
      closeModal();
      return true;
    } catch (err) {
      alert(err.response?.data?.message || 'Не удалось сохранить комментарий');
      return false;
    }
  };

  return {
    modal,
    setModal,
    openModal,
    closeModal,
    save
  };
};
