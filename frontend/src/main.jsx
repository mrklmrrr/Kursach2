import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthProvider/AuthProvider';
import ToastProvider from './contexts/ToastProvider/ToastProvider';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';

// Global styles (порядок: токены → база → премиум-слой)
import './styles/tokens.css';
import './styles/global.css';
import './styles/theme.css';
import './styles/pageShell.css';

// UI component styles
import './components/ui/Button/Button.css';
import './components/ui/Input/Input.css';
import './components/ui/Avatar/Avatar.css';
import './components/ui/Loader/Loader.css';

// Layout component styles
import './components/layout/AppHeader/AppHeader.css';
import './components/layout/BottomNav/BottomNav.css';
import './components/layout/PageLayout/PageLayout.css';

// Feature component styles
import './components/features/DoctorCard/DoctorCard.css';
import './components/features/ConsultationCard/ConsultationCard.css';
import './components/features/VideoCall/VideoCall.css';
import './components/features/ThemeToggle/ThemeToggle.css';
import './components/features/OnboardingGate/OnboardingGate.css';
import './components/common/ErrorBoundary/ErrorBoundary.css';

// Page styles
import './pages/auth/Login/AuthForms.css';
import './pages/auth/Register/AuthForms.css';
import './pages/home/Home/Home.css';
import './pages/doctors/Doctors/Doctors.css';
import './pages/doctors/DoctorProfile/DoctorProfile.css';
import './pages/chat/Chats/Chats.css';
import './pages/chat/ChatRoom/ChatRoom.css';
import './pages/consultation/Consultation/Consultation.css';
import './pages/profile/Profile/Profile.css';
import './pages/profile/AddRelative/AddRelative.css';
import './pages/payment/Payment/Payment.css';
import './pages/payment/Confirm/Confirm.css';
import './pages/doctorPanel/DoctorPanel.css';
import './pages/doctorPanel/ResearchManagement.css';
import './pages/admin/Admin.css';
import './pages/admin/AdminDashboard.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
