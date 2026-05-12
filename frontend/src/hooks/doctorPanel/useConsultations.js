import { useState } from 'react';
import { useToast } from '@contexts/ToastProvider/useToast';
import { doctorPanelApi } from '@services/doctorPanelApi';
import { appointmentApi } from '@services/appointmentApi';

export const useConsultations = () => {
  const { showToast } = useToast();

  const handleAccept = async (id, onSuccess) => {
    try {
      await doctorPanelApi.acceptConsultation(id);
      if (typeof onSuccess === 'function') {
        onSuccess(id);
      }
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка', 'error');
      return false;
    }
  };

  const handleReject = async (id, onSuccess) => {
    try {
      await doctorPanelApi.rejectConsultation(id);
      if (typeof onSuccess === 'function') {
        onSuccess(id);
      }
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка', 'error');
      return false;
    }
  };

  return {
    handleAccept,
    handleReject
  };
};

export const useCommentModal = () => {
  const { showToast } = useToast();
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
      showToast('Комментарий сохранён', 'success');
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || 'Не удалось сохранить комментарий', 'error');
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