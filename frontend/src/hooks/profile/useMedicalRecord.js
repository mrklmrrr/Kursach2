import { useState, useEffect, useMemo } from 'react';
import { medicalRecordApi } from '@services/medicalRecordApi';

export const useMedicalRecord = (user) => {
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [laboratoryResults, setLaboratoryResults] = useState([]);
  const [instrumentalResults, setInstrumentalResults] = useState([]);
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
        const [recordRes, labRes, instrRes] = await Promise.allSettled([
          medicalRecordApi.getMyRecord(),
          medicalRecordApi.getMyLaboratoryResults(),
          medicalRecordApi.getMyInstrumentalResults()
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
        if (instrRes.status === 'fulfilled') {
          const raw = instrRes.value.data;
          setInstrumentalResults(Array.isArray(raw) ? raw : []);
        } else {
          setInstrumentalResults([]);
        }
      } catch (err) {
        setMedicalRecord(null);
        setLaboratoryResults([]);
        setInstrumentalResults([]);
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

  const reloadInstrumentalResults = async () => {
    if (!user || user.role === 'doctor') return;
    try {
      const { data } = await medicalRecordApi.getMyInstrumentalResults();
      setInstrumentalResults(Array.isArray(data) ? data : []);
    } catch {
      setInstrumentalResults([]);
    }
  };

  return {
    medicalRecord,
    laboratoryResults,
    instrumentalResults,
    reloadLaboratoryResults,
    reloadInstrumentalResults,
    loading,
    error,
    allLeaves,
    openLeaves,
    currentLeaf
  };
};