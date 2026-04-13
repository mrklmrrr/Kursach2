import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/common/PrivateRoute/PrivateRoute';

// Auth pages
import Splash from './pages/auth/Splash/Splash';
import Register from './pages/auth/Register/Register';
import Login from './pages/auth/Login/Login';

// Home
import Home from './pages/home/Home/Home';

// Doctors
import Doctors from './pages/doctors/Doctors/Doctors';
import DoctorProfile from './pages/doctors/DoctorProfile/DoctorProfile';

// Chats
import Chats from './pages/chat/Chats/Chats';
import ChatRoom from './pages/chat/ChatRoom/ChatRoom';

// Emergency
import Emergency from './pages/emergency/Emergency/Emergency';

// Consultation
import Consultation from './pages/consultation/Consultation/Consultation';

// Profile
import Profile from './pages/profile/Profile/Profile';
import AddRelative from './pages/profile/AddRelative/AddRelative';

// Payment
import Payment from './pages/payment/Payment/Payment';
import Confirm from './pages/payment/Confirm/Confirm';
import LoaderPage from './pages/payment/Loader/Loader';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Splash />} />
        <Route path="/splash" element={<Splash />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/doctors" element={<PrivateRoute><Doctors /></PrivateRoute>} />
        <Route path="/doctor/:id" element={<PrivateRoute><DoctorProfile /></PrivateRoute>} />
        <Route path="/chats" element={<PrivateRoute><Chats /></PrivateRoute>} />
        <Route path="/chat/doctor/:id" element={<PrivateRoute><ChatRoom /></PrivateRoute>} />
        <Route path="/emergency" element={<PrivateRoute><Emergency /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/profile/add-relative" element={<PrivateRoute><AddRelative /></PrivateRoute>} />
        <Route path="/confirm" element={<PrivateRoute><Confirm /></PrivateRoute>} />
        <Route path="/payment" element={<PrivateRoute><Payment /></PrivateRoute>} />
        <Route path="/loader" element={<PrivateRoute><LoaderPage /></PrivateRoute>} />
        <Route path="/consultation/:id" element={<PrivateRoute><Consultation /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
