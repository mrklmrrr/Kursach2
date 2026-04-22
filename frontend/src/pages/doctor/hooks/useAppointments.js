import { useState } from 'react';
import { appointmentApi } from '../../../services/appointmentApi';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    date: '',
    time: '',
    type: 'online',
    consultationType: 'online',
    duration: 30
  });

  const resetForm = () => {
    setAppointmentForm({
      patientId: '',
      date: '',
      time: '',
      type: 'online',
      consultationType: 'online',
      duration: 30
    });
  };

  const handleFormChange = (e) => {
    setAppointmentForm({ ...appointmentForm, [e.target.name]: e.target.value });
  };

  const handleAssign = async (e, loadData) => {
    e.preventDefault();
    try {
      await appointmentApi.assignAppointment(appointmentForm);
      alert('Запись создана');
      resetForm();
      loadData();
      return true;
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка создания записи');
      return false;
    }
  };

  const handleCancel = async (id, loadData) => {
    if (!confirm('Отменить эту запись?')) return;
    try {
      await appointmentApi.deleteAppointment(id);
      setAppointments(prev => prev.filter(a => a._id !== id));
      loadData();
      return true;
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка отмены');
      return false;
    }
  };

  return {
    appointments,
    setAppointments,
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
