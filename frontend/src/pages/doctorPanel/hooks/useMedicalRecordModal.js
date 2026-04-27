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
  const [tab, setTab] = useState('systems');
  const [showSickLeaveHistory, setShowSickLeaveHistory] = useState(false);

  const openMedicalRecord = async (patient) => {
    if (!patient?.id) return;
    
    setModal({
      open: true,
      patient,
      record: null,
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

  const addSickLeaveDraft = (user) => {
    setModal((prev) => {
      if (!prev.record) return prev;
      return {
        ...prev,
        record: {
          ...prev.record,
          sickLeaves: [
            {
              tempId: `temp-${Date.now()}`,
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
    setModal((prev) => {
      if (!prev.record) return prev;
      return {
        ...prev,
        record: {
          ...prev.record,
          sickLeaves: (prev.record.sickLeaves || []).map((leaf) => {
            const key = leaf._id || leaf.tempId;
            return key === leafKey ? { ...leaf, [field]: value } : leaf;
          })
        }
      };
    });
  };

  const saveSickLeave = async (leaf) => {
    if (!modal.patient?.id) return;
    
    const leafKey = leaf._id || leaf.tempId || '';
    if (!leafKey || leaf.originalStatus === 'closed') return;

    setModal((prev) => ({ ...prev, savingSectionKey: leafKey, error: '' }));
    
    const payload = {
      issueDate: leaf.issueDate || '',
      startDate: leaf.startDate || '',
      endDate: leaf.endDate || '',
      disease: leaf.disease || '',
      diagnosis: leaf.diagnosis || '',
      recommendations: leaf.recommendations || '',
      status: leaf.status || 'open'
    };

    try {
      const { data } = leaf._id
        ? await medicalRecordApi.updatePatientSickLeave(modal.patient.id, leaf._id, payload)
        : await medicalRecordApi.createPatientSickLeave(modal.patient.id, payload);

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
        savingSectionKey: ''
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
    saveSickLeave
  };
};
