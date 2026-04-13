import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthProvider/AuthProvider';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';

import './styles/global.css';

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
