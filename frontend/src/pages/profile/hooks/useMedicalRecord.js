import { useState, useEffect, useMemo } from 'react';
import { medicalRecordApi } from '../../../services/medicalRecordApi';

export const useMedicalRecord = (user) => {
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [laboratoryResults, setLaboratoryResults] = useState([]);
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
        const [recordRes, labRes] = await Promise.allSettled([
          medicalRecordApi.getMyRecord(),
          medicalRecordApi.getMyLaboratoryResults()
        ]);
        if (recordRes.status === 'fulfilled') {
          setMedicalRecord(recordRes.value.data);
        } else {
          setMedicalRecord(null);
          setError(recordRes.reason?.response?.data?.message || 'Не удалось загрузить медицинскую карту');
        }
        if (labRes.status === 'fulfilled') {
          const raw = labRes.value.data;
          setLaboratoryResults(Array.isArray(raw) ? raw : []);
        } else {
          setLaboratoryResults([]);
        }
      } catch (err) {
        setMedicalRecord(null);
        setLaboratoryResults([]);
        setError(err.response?.data?.message || 'Не удалось загрузить медицинскую карту');
      } finally {
        setLoading(false);
      }
    };

    loadMedicalRecord();
  }, [user]);

  const reloadLaboratoryResults = async () => {
    if (!user || user.role === 'doctor') return;
    try {
      const { data } = await medicalRecordApi.getMyLaboratoryResults();
      setLaboratoryResults(Array.isArray(data) ? data : []);
    } catch {
      setLaboratoryResults([]);
    }
  };

  return {
    medicalRecord,
    laboratoryResults,
    reloadLaboratoryResults,
    loading,
    error,
    allLeaves,
    openLeaves,
    currentLeaf
  };
};