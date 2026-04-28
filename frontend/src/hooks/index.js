// Core hooks
export { useAuth } from './useAuth';
export { useTimer } from './useTimer';
export { useLocalStorage } from './useLocalStorage';
export { useMediaStream } from './useMediaStream';
export { useWebRTC } from './useWebRTC';

// Profile hooks
export { useConsultationHistory, useMedicalRecord, usePasswordChange } from './profile';

// Doctor panel hooks
export {
  useDoctorPanelData,
  useMedicalRecordModal,
  useConsultations,
  useCommentModal,
  useAppointments,
  useWorkingHours
} from './doctorPanel';

// Research hooks
export { useResearchData, useResearchForm, useTemplateBuilder } from './doctorPanel/useResearch';
