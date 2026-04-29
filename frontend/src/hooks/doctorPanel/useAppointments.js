import { useState } from 'react';
import { appointmentApi } from '@services/appointmentApi';

export const useAppointments = () => {
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    datetime: '',
    type: 'online',
    consultationType: 'online',
    duration: 30
  });

  const resetForm = () => {
    setAppointmentForm({
      patientId: '',
      datetime: '',
      type: 'online',
      consultationType: 'online',
      duration: 30
    });
  };

  const handleFormChange = (e) => {
    setAppointmentForm({ ...appointmentForm, [e.target.name]: e.target.value });
  };

  const handleAssign = async (e, onSuccess) => {
    e.preventDefault();
    try {
      let payload = { ...appointmentForm };
      if (payload.datetime) {
        const [date, timeWithSec] = payload.datetime.split('T');
        const time = timeWithSec.slice(0, 5);
        payload.date = date;
        payload.time = time;
        delete payload.datetime;
      }
      const { data } = await appointmentApi.assignAppointment(payload);
      alert('Запись создана');
      resetForm();
      if (typeof onSuccess === 'function') {
        onSuccess(data);
      }
      return true;
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка создания записи');
      return false;
    }
  };

  const handleCancel = async (id, onSuccess) => {
    if (!confirm('Отменить эту запись?')) return;
    try {
      await appointmentApi.deleteAppointment(id);
      if (typeof onSuccess === 'function') {
        onSuccess(id);
      }
      return true;
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка отмены');
      return false;
    }
  };

  return {
    appointmentForm,
    setAppointmentForm,
    handleFormChange,
    handleAssign,
    handleCancel,
    resetForm
  };
};

export const useWorkingHours = () => {
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '18:00' });
  const [workingDays, setWorkingDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']);

  const toggleDay = (day) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const save = async () => {
    try {
      await appointmentApi.updateWorkingHours({ workingHours, workingDays });
      return { success: true, message: 'Рабочее время сохранено' };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Ошибка сохранения' 
      };
    }
  };

  return {
    workingHours,
    setWorkingHours,
    workingDays,
    setWorkingDays,
    toggleDay,
    save
  };
};