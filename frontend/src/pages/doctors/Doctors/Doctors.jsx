import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorApi } from '../../../services/doctorApi';
import { AppHeader, BottomNav } from '../../../components/layout';
import { DoctorCard } from '../../../components/features';
import { Input } from '../../../components/ui';
import { EmptyState } from '../../../components/ui';
import './Doctors.css';

export default function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    doctorApi.getAll().then((res) => setDoctors(res.data));
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'online') return matchesSearch && doc.isOnline;
    return matchesSearch;
  });

  return (
    <div className="doctors-page">
      <AppHeader showBack backTo="/home" />
      <div className="doctors-page-content">
        <div className="search-bar">
          <Input
            type="text"
            placeholder="Поиск врача или специальности..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все врачи
          </button>
          <button
            className={`filter-btn ${filter === 'online' ? 'active' : ''}`}
            onClick={() => setFilter('online')}
          >
            Только онлайн
          </button>
        </div>

        <div className="doctors-list">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} variant="full" />
            ))
          ) : (
            <EmptyState icon="search_off" title="Врачи не найдены" description="Попробуйте изменить параметры поиска" />
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
