import { useState, useEffect, useMemo } from 'react';
import { medicalRecordApi } from '../../../services/medicalRecordApi';

export const useMedicalRecord = (user) => {
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allLeaves = useMemo(() => medicalRecord?.sickLeaves || [], [medicalRecord]);
  const openLeaves = useMemo(() => allLeaves.filter(leaf => leaf.status === 'open'), [allLeaves]);
  const currentLeaf = useMemo(() => openLeaves.length > 0 ? openLeaves[0] : null, [openLeaves]);

  useEffect(() => {
    const loadMedicalRecord = async () => {
      if (!user || user.role === 'doctor') return;
      setLoading(true);
      setError('');
      try {
        const { data } = await medicalRecordApi.getMyRecord();
        setMedicalRecord(data);
      } catch (error) {
        setMedicalRecord(null);
        setError(error.response?.data?.message || 'Не удалось загрузить медицинскую карту');
      } finally {
        setLoading(false);
      }
    };

    loadMedicalRecord();
  }, [user]);

  return {
    medicalRecord,
    loading,
    error,
    allLeaves,
    openLeaves,
    currentLeaf
  };
};