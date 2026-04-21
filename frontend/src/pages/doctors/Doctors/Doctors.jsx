import { useState, useEffect, useMemo } from 'react';
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
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;

    const loadDoctors = async () => {
      setLoadingDoctors(true);
      setLoadingError('');
      try {
        const res = await doctorApi.getAll();
        if (isMounted) {
          setDoctors(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        if (isMounted) {
          setDoctors([]);
          setLoadingError(error.response?.data?.message || 'Не удалось загрузить список врачей');
        }
      } finally {
        if (isMounted) {
          setLoadingDoctors(false);
        }
      }
    };

    loadDoctors();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDoctors = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return doctors.filter((doc) => {
      const doctorName = String(doc.name || '').toLowerCase();
      const doctorSpecialty = String(doc.specialty || '').toLowerCase();
      const matchesSearch =
        doctorName.includes(normalizedSearch) ||
        doctorSpecialty.includes(normalizedSearch);

      if (filter === 'online') return matchesSearch && doc.isOnline;
      return matchesSearch;
    });
  }, [doctors, searchTerm, filter]);

  return (
    <div className="doctors-page">
      <AppHeader showBack backTo="/home" />
      <div className="doctors-page-content page-shell page-shell--flex-grow">
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
          {loadingDoctors ? (
            <EmptyState icon="hourglass_top" title="Загрузка врачей..." />
          ) : loadingError ? (
            <EmptyState icon="error_outline" title={loadingError} />
          ) : filteredDoctors.length > 0 ? (
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
