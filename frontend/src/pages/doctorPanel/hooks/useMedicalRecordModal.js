import { useState } from 'react';
import { medicalRecordApi } from '../../../services/medicalRecordApi';

export const useMedicalRecordModal = () => {
  const [modal, setModal] = useState({
    open: false,
    patient: null,
    record: null,
    laboratoryResults: [],
    instrumentalResults: [],
    loading: false,
    savingSectionKey: '',
    error: ''
  });

  const [expandedSection, setExpandedSection] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const toggleHistory = () => setHistoryOpen(prev => !prev);
  const [tab, setTab] = useState('systems');
  const [showSickLeaveHistory, setShowSickLeaveHistory] = useState(false);
  const toggleSickLeaveHistory = () => setShowSickLeaveHistory(prev => !prev);

  // Локальное состояние для несохраненных изменений больничных листов
  const [dirtySickLeaves, setDirtySickLeaves] = useState(new Map());

  const openMedicalRecord = async (patient) => {
    if (!patient?.id) return;

    setModal({
      open: true,
      patient,
      record: null,
      laboratoryResults: [],
      instrumentalResults: [],
      loading: true,
      savingSectionKey: '',
      error: ''
    });

    setExpandedSection('');
    setHistoryOpen(false);
    setTab('systems');

    try {
      const [recordRes, labRes, instrRes] = await Promise.allSettled([
        medicalRecordApi.getPatientRecord(patient.id),
        medicalRecordApi.getLaboratoryResults(patient.id),
        medicalRecordApi.getInstrumentalResults(patient.id)
      ]);

      const recordData = recordRes.status === 'fulfilled' ? recordRes.value.data : null;
      const labData = labRes.status === 'fulfilled' ? labRes.value.data : [];
      const instrData = instrRes.status === 'fulfilled' ? instrRes.value.data : [];

      const recordWithOriginal = recordData ? {
        ...recordData,
        sickLeaves: (recordData.sickLeaves || []).map(leaf => ({ ...leaf, originalStatus: leaf.status }))
      } : null;

      // АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ЧЕРНОВИКА, если нет открытых листов
      const hasOpenLeave = recordWithOriginal?.sickLeaves?.some(l => l.status === 'open');
      if (!hasOpenLeave) {
        // Создаем структуру черновика вручную, чтобы не зависеть от внешней функции addSickLeaveDraft
        const draftLeaf = {
          tempId: `temp-${Date.now()}`,
          issueDate: new Date().toISOString(),
          startDate: '',
          endDate: '',
          disease: '',
          diagnosis: '',
          recommendations: '',
          status: 'open',
          originalStatus: 'open',
          doctorName: 'Врач',
          updatedAt: new Date().toISOString()
        };

        if (recordWithOriginal) {
          recordWithOriginal.sickLeaves = [draftLeaf, ...(recordWithOriginal.sickLeaves || [])];
        } else {
          recordWithOriginal = { systems: [], changeLogs: [], sickLeaves: [draftLeaf] };
        }
      }

      setModal((prev) => ({
        ...prev,
        patient: { ...patient, ...(recordData?.patient || {}) },
        record: recordWithOriginal,
        laboratoryResults: Array.isArray(labData) ? labData : [],
        instrumentalResults: Array.isArray(instrData) ? instrData : [],
        loading: false,
        error: recordRes.status === 'rejected' ? (recordRes.reason?.response?.data?.message || 'Не удалось загрузить медицинскую карту') : ''
      }));
    } catch (err) {
      setModal((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Не удалось загрузить медицинскую карту'
      }));
    }
  };

  const closeMedicalRecord = () => {
    setModal({
      open: false,
      patient: null,
      record: null,
      laboratoryResults: [],
      instrumentalResults: [],
      loading: false,
      savingSectionKey: '',
      error: ''
    });
    setExpandedSection('');
    setHistoryOpen(false);
    setTab('systems');
    setShowSickLeaveHistory(false);
    setDirtySickLeaves(new Map()); // Очищаем несохраненные изменения
  };

  const updateMedicalField = (sectionKey, field, value) => {
    setModal((prev) => {
      if (!prev.record) return prev;
      return {
        ...prev,
        record: {
          ...prev.record,
          systems: (prev.record.systems || []).map((section) =>
            section.key === sectionKey ? { ...section, [field]: value } : section
          )
        }
      };
    });
  };

  const saveSection = async (section) => {
    if (!modal.patient?.id || !section?.key) return;
    
    setModal((prev) => ({ ...prev, savingSectionKey: section.key, error: '' }));
    
    try {
      const { data } = await medicalRecordApi.updatePatientSection(
        modal.patient.id,
        section.key,
        {
          notes: section.notes || '',
          diagnosis: section.diagnosis || '',
          treatment: section.treatment || '',
          recommendations: section.recommendations || ''
        }
      );
      
      setModal((prev) => ({
        ...prev,
        savingSectionKey: '',
        record: {
          ...(prev.record || {}),
          ...data,
          patient: prev.patient
        }
      }));
    } catch (err) {
      setModal((prev) => ({
        ...prev,
        savingSectionKey: '',
        error: err.response?.data?.message || 'Не удалось сохранить раздел'
      }));
    }
  };

  // Функция для получения данных больничного листа с учетом локальных изменений
  const getSickLeaveWithChanges = (leaf) => {
    const leafKey = leaf._id || leaf.tempId;
    const localChanges = dirtySickLeaves.get(leafKey) || {};
    return { ...leaf, ...localChanges };
  };

  // Функция для проверки, есть ли несохраненные изменения
  const hasUnsavedChanges = (leafKey) => {
    return dirtySickLeaves.has(leafKey);
  };

  const addSickLeaveDraft = (user) => {
    const newLeafKey = `temp-${Date.now()}`;
    setModal((prev) => {
      if (!prev.record) return prev;
      return {
        ...prev,
        record: {
          ...prev.record,
          sickLeaves: [
            {
              tempId: newLeafKey,
              issueDate: new Date().toISOString(),
              startDate: '',
              endDate: '',
              disease: '',
              diagnosis: '',
              recommendations: '',
              status: 'open',
              originalStatus: 'open',
              doctorName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Врач',
              updatedAt: ''
            },
            ...(prev.record.sickLeaves || [])
          ]
        }
      };
    });
  };

  const updateSickLeaveField = (leafKey, field, value) => {
    // Сохраняем изменения локально, не обновляя основной state
    setDirtySickLeaves((prev) => {
      const current = prev.get(leafKey) || {};
      const updated = { ...current, [field]: value };
      const newMap = new Map(prev);
      newMap.set(leafKey, updated);
      return newMap;
    });
  };

  const saveSickLeave = async (leaf) => {
    if (!modal.patient?.id) return;

    const leafKey = leaf._id || leaf.tempId || '';
    if (!leafKey || leaf.originalStatus === 'closed') return;

    setModal((prev) => ({ ...prev, savingSectionKey: leafKey, error: '' }));

    // Получаем локальные изменения для этого листа
    const localChanges = dirtySickLeaves.get(leafKey) || {};

    // Объединяем оригинальные данные с локальными изменениями
    const payload = {
      issueDate: localChanges.issueDate || leaf.issueDate || '',
      startDate: localChanges.startDate || leaf.startDate || '',
      endDate: localChanges.endDate || leaf.endDate || '',
      disease: localChanges.disease || leaf.disease || '',
      diagnosis: localChanges.diagnosis || leaf.diagnosis || '',
      recommendations: localChanges.recommendations || leaf.recommendations || '',
      status: localChanges.status || leaf.status || 'open'
    };

    try {
      const { data } = leaf._id
        ? await medicalRecordApi.updatePatientSickLeave(modal.patient.id, leaf._id, payload)
        : await medicalRecordApi.createPatientSickLeave(modal.patient.id, payload);

      // Очищаем локальные изменения после успешного сохранения
      setDirtySickLeaves((prev) => {
        const newMap = new Map(prev);
        newMap.delete(leafKey);
        return newMap;
      });

      setModal((prev) => {
        const updatedRecord = {
          ...(prev.record || {}),
          ...data,
          patient: prev.patient,
          sickLeaves: (data.sickLeaves || []).map(leaf => ({ ...leaf, originalStatus: leaf.status }))
        };
        return {
          ...prev,
          savingSectionKey: '',
          record: updatedRecord
        };
      });
    } catch (err) {
      console.error('Ошибка сохранения больничного листа:', err);
      setModal((prev) => ({
        ...prev,
        savingSectionKey: '',
        error: err.response?.data?.message || 'Не удалось сохранить больничный лист'
      }));
    }
  };

  return {
    modal,
    expandedSection,
    setExpandedSection,
    historyOpen,
    setHistoryOpen,
    tab,
    setTab,
    showSickLeaveHistory,
    setShowSickLeaveHistory,
    openMedicalRecord,
    closeMedicalRecord,
    updateMedicalField,
    saveSection,
    addSickLeaveDraft,
    updateSickLeaveField,
    saveSickLeave,
    getSickLeaveWithChanges,
    hasUnsavedChanges,
    toggleHistory,
    toggleSickLeaveHistory
  };


};
