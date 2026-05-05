import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { adminApi } from '../../services/authApi';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const emptyFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialty: '',
    price: '',
    experience: '',
    description: '',
    password: ''
  };
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [loading, setLoading] = useState(true);
  const getDoctorId = (doctor) => doctor?.id || doctor?._id;

  const loadData = async () => {
    try {
      const [dashRes, docRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getDoctors()
      ]);
      setDashboard(dashRes.data);
      setDoctors(docRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tab !== 'b2b' && tab !== 'compliance') return;
    const load = async () => {
      try {
        if (tab === 'b2b') {
          setB2bErr('');
          const res = await adminApi.getB2BMetrics();
          setB2b(res.data);
        } else {
          setAuditErr('');
          const res = await adminApi.getAuditLog();
          setAudit(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (tab === 'b2b') setB2bErr('Не удалось загрузить B2B-метрики');
        else setAuditErr('Не удалось загрузить журнал');
      }
    };
    load();
  }, [tab]);

  const exportB2BCsv = () => {
    if (!b2b) return;
    const rows = Object.entries(b2b).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : v]);
    const esc = (c) => `"${String(c).replace(/"/g, '""')}"`;
    const csv = [['metric', 'value'], ...rows].map((r) => r.map(esc).join(';')).join('\n');
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `b2b-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV сохранён', 'success');
  };

  const exportAuditCsv = () => {
    if (!audit.length) return;
    const esc = (c) => `"${String(c ?? '').replace(/"/g, '""')}"`;
    const header = ['createdAt', 'action', 'actorRole', 'resource', 'details'];
    const lines = [
      header.join(';'),
      ...audit.map((row) =>
        [row.createdAt, row.action, row.actorRole, row.resource, row.details].map(esc).join(';')
      )
    ];
    const csv = '\ufeff' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Журнал экспортирован', 'success');
  };

  const printB2B = () => window.print();

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createDoctor(formData);
      setFormData(emptyFormData);
      setShowForm(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка создания врача');
    }
  };

  const startEditDoctor = (doctor) => {
    const doctorId = getDoctorId(doctor);
    if (!doctorId) {
      alert('Не удалось определить ID врача');
      return;
    }
    setEditingDoctorId(doctorId);
    setFormData({
      firstName: doctor.firstName || '',
      lastName: doctor.lastName || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      specialty: doctor.specialty || '',
      price: doctor.price ?? '',
      experience: doctor.experience ?? '',
      description: doctor.description || '',
      password: ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingDoctorId(null);
    setFormData(emptyFormData);
    setShowForm(false);
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    if (!editingDoctorId) return;
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        specialty: formData.specialty,
        price: formData.price,
        experience: formData.experience,
        description: formData.description
      };
      await adminApi.updateDoctor(editingDoctorId, payload);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка редактирования врача');
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!id) {
      alert('Не удалось определить ID врача');
      return;
    }
    if (!confirm('Удалить врача?')) return;
    try {
      await adminApi.deleteDoctor(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleToggleOnline = async (doctor) => {
    const doctorId = getDoctorId(doctor);
    if (!doctorId) {
      alert('Не удалось определить ID врача');
      return;
    }
    try {
      await adminApi.toggleDoctorOnline(doctorId, !doctor.isOnline);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading-spinner">Загрузка...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Админ-панель</h1>
        <div className="admin-header-actions">
          <span>{user?.firstName} {user?.lastName}</span>
          <button type="button" className="logout-btn" onClick={() => { logout(); navigate('/admin'); }}>
            Выйти
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button type="button" className={`tab-btn ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
          📊 Дашборд
        </button>
        <button type="button" className={`tab-btn ${tab === 'doctors' ? 'active' : ''}`} onClick={() => setTab('doctors')}>
          👨‍⚕️ Врачи
        </button>
      </div>

      {tab === 'dashboard' && dashboard && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <span className="stat-value">{dashboard.totalPatients}</span>
            <span className="stat-label">Пациенты</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🩺</span>
            <span className="stat-value">{dashboard.totalDoctors}</span>
            <span className="stat-label">Врачи</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💬</span>
            <span className="stat-value">{dashboard.totalConsultations}</span>
            <span className="stat-label">Консультации</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏳</span>
            <span className="stat-value">{dashboard.pendingConsultations}</span>
            <span className="stat-label">Ожидают</span>
          </div>
        </div>
      )}

      {tab === 'doctors' && (
        <div className="admin-doctors">
          <button
            type="button"
            className="add-btn"
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
          >
            {showForm ? '✕ Отмена' : '+ Добавить врача'}
          </button>

          {showForm && (
            <form
              className="doctor-form"
              onSubmit={editingDoctorId ? handleUpdateDoctor : handleCreateDoctor}
            >
              <input placeholder="Имя" value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})} required />
              <input placeholder="Фамилия" value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})} required />
              <input type="email" placeholder="Email" value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})} />
              <input placeholder="Телефон" value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input placeholder="Специальность" value={formData.specialty}
                onChange={e => setFormData({...formData, specialty: e.target.value})} required />
              <input type="number" placeholder="Цена" value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})} required />
              <input type="number" placeholder="Опыт (лет)" value={formData.experience}
                onChange={e => setFormData({...formData, experience: e.target.value})} />
              <input placeholder="Описание" value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})} />
              {!editingDoctorId && (
                <input type="password" placeholder="Пароль (по умолч.: doctor123)" value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})} />
              )}
              <button type="submit">{editingDoctorId ? 'Сохранить' : 'Создать'}</button>
            </form>
          )}

          <div className="doctors-list">
            {doctors.map(doc => (
              <div key={getDoctorId(doc)} className="doctor-card">
                <div className="doctor-info">
                  <h3>{doc.firstName} {doc.lastName}</h3>
                  <p className="specialty">{doc.specialty}</p>
                  <p className="price">{doc.price} BYN</p>
                </div>
                <div className="doctor-actions">
                  <button type="button" className="edit-btn" onClick={() => startEditDoctor(doc)}>
                    ✏️
                  </button>
                  <label className="toggle-online">
                    <input type="checkbox" checked={doc.isOnline}
                      onChange={() => handleToggleOnline(doc)} />
                    <span>Онлайн</span>
                  </label>
                  <button type="button" className="delete-btn" onClick={() => handleDeleteDoctor(getDoctorId(doc))}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
