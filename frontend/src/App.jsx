import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Splash from './pages/Splash';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Emergency from './pages/Emergency';
import Doctors from './pages/Doctors';
import DoctorProfile from './pages/DoctorProfile';
import Consultation from './pages/Consultation';
import Chats from './pages/Chats';
import ChatRoom from './pages/ChatRoom';
import Profile from './pages/Profile';
import AddRelative from './pages/AddRelative';
import Payment from './pages/Payment';
import Confirm from './pages/Confirm';
import Loader from './pages/Loader';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/emergency" element={<PrivateRoute><Emergency /></PrivateRoute>} />
        <Route path="/doctors" element={<PrivateRoute><Doctors /></PrivateRoute>} />
        <Route path="/doctor/:id" element={<PrivateRoute><DoctorProfile /></PrivateRoute>} />
        <Route path="/confirm" element={<PrivateRoute><Confirm /></PrivateRoute>} />
        <Route path="/payment" element={<PrivateRoute><Payment /></PrivateRoute>} />
        <Route path="/loader" element={<PrivateRoute><Loader /></PrivateRoute>} />
        <Route path="/consultation/:id" element={<PrivateRoute><Consultation /></PrivateRoute>} />
        <Route path="/chats" element={<PrivateRoute><Chats /></PrivateRoute>} />
        <Route path="/chat/:id" element={<PrivateRoute><ChatRoom /></PrivateRoute>} />
        <Route path="/chat/doctor/:id" element={<PrivateRoute><ChatRoom /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/profile/add-relative" element={<PrivateRoute><AddRelative /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;