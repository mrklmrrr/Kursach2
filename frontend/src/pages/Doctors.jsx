import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import api from '../services/api';

export default function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/doctors').then(res => setDoctors(res.data));
  }, []);

  const filteredDoctors = doctors.filter(doc => {
    const matchSpecialty = filterSpecialty === '' || doc.specialty === filterSpecialty;
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase()) ||
                         doc.specialty.toLowerCase().includes(search.toLowerCase());
    return matchSpecialty && matchSearch;
  });

  const specialties = ['', 'Педиатр', 'Терапевт', 'Травматолог', 'Психолог', 'Онколог', 'ЛОР', 'Кардиолог'];
  const specialtyLabels = {
    '': 'Все',
    'Педиатр': 'Педиатр',
    'Терапевт': 'Терапевт',
    'Травматолог': 'Травматолог',
    'Психолог': 'Психолог',
    'Онколог': 'Онколог',
    'ЛОР': 'ЛОР',
    'Кардиолог': 'Кардиолог'
  };

  return (
    <>
      <header>
        <div className="logo">Мед24/7</div>
        <div className="avatar">А</div>
      </header>
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Поиск по имени или специальности..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="filters">
        {specialties.map(spec => (
          <button
            key={spec || 'all'}
            className={`filter-btn ${filterSpecialty === spec ? 'active' : ''}`}
            onClick={() => setFilterSpecialty(spec)}
          >
            {specialtyLabels[spec]} {spec === '' && `(${filteredDoctors.length})`}
          </button>
        ))}
      </div>
      <div className="doctors-list">
        {filteredDoctors.map(doc => (
          <div key={doc.id} className="doctor-item" onClick={() => navigate(`/doctor/${doc.id}`)}>
            <div className="doctor-left">
              <span className="material-icons doctor-avatar">face</span>
              <div className="doctor-info">
                <div className="doctor-name">{doc.name}</div>
                <div className="doctor-spec">{doc.specialty} • Стаж 12 лет</div>
                <div className="doctor-rating">★★★★★ {doc.rating}</div>
              </div>
            </div>
            <div className="doctor-right">
              <div className="online">{doc.isOnline ? 'Онлайн' : 'Офлайн'}</div>
              <div className="price">{doc.price} BYN / 15 мин</div>
              <button className="btn-primary small-btn" onClick={(e) => { e.stopPropagation(); navigate(`/doctor/${doc.id}`); }}>Записаться</button>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </>
  );
}