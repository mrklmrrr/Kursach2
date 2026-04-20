import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { adminApi } from '../../services/authApi';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    specialty: '', price: '', experience: '', description: '', password: ''
  });
  const [loading, setLoading] = useState(true);

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

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createDoctor(formData);
      setFormData({
        firstName: '', lastName: '', email: '', phone: '',
        specialty: '', price: '', experience: '', description: '', password: ''
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка создания врача');
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!confirm('Удалить врача?')) return;
    try {
      await adminApi.deleteDoctor(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleToggleOnline = async (doctor) => {
    try {
      await adminApi.toggleDoctorOnline(doctor.id, !doctor.isOnline);
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
          <button className="logout-btn" onClick={() => { logout(); navigate('/admin'); }}>
            Выйти
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
          📊 Дашборд
        </button>
        <button className={`tab-btn ${tab === 'doctors' ? 'active' : ''}`} onClick={() => setTab('doctors')}>
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
          <button className="add-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Отмена' : '+ Добавить врача'}
          </button>

          {showForm && (
            <form className="doctor-form" onSubmit={handleCreateDoctor}>
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
              <input type="password" placeholder="Пароль (по умолч.: doctor123)" value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})} />
              <button type="submit">Создать</button>
            </form>
          )}

          <div className="doctors-list">
            {doctors.map(doc => (
              <div key={doc._id} className="doctor-card">
                <div className="doctor-info">
                  <h3>{doc.firstName} {doc.lastName}</h3>
                  <p className="specialty">{doc.specialty}</p>
                  <p className="price">{doc.price} BYN</p>
                </div>
                <div className="doctor-actions">
                  <label className="toggle-online">
                    <input type="checkbox" checked={doc.isOnline}
                      onChange={() => handleToggleOnline(doc)} />
                    <span>Онлайн</span>
                  </label>
                  <button className="delete-btn" onClick={() => handleDeleteDoctor(doc.id)}>
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
