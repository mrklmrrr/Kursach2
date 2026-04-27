import Register from '../pages/auth/Register/Register';
import Login from '../pages/auth/Login/Login';
import Home from '../pages/home/Home/Home';
import Doctors from '../pages/doctors/Doctors/Doctors';
import DoctorProfile from '../pages/doctors/DoctorProfile/DoctorProfile';
import Chats from '../pages/chat/Chats/Chats';
import ChatRoom from '../pages/chat/ChatRoom/ChatRoom';
import Emergency from '../pages/emergency/Emergency/Emergency';
import Consultation from '../pages/consultation/Consultation/Consultation';
import VideoRoom from '../pages/video-room/VideoRoom/VideoRoom';
import Profile from '../pages/profile/Profile/Profile';
import AddRelative from '../pages/profile/AddRelative/AddRelative';
import Payment from '../pages/payment/Payment/Payment';
import Confirm from '../pages/payment/Confirm/Confirm';
import LoaderPage from '../pages/payment/Loader/Loader';
import Admin from '../pages/admin/Admin';
import DoctorPanel from '../pages/doctorPanel/DoctorPanel';
import LaboratoryResearch from '../pages/doctorPanel/LaboratoryResearch';
import InstrumentalResearch from '../pages/doctorPanel/InstrumentalResearch';
import Splash from '../pages/auth/Splash/Splash';
import Landing from '../pages/marketing/Landing/Landing';
import Plans from '../pages/marketing/Plans/Plans';
import Demo from '../pages/marketing/Demo/Demo';
import Triage from '../pages/marketing/Triage/Triage';
import Trust from '../pages/marketing/Trust/Trust';

export const routes = {
  public: [
    { path: '/', element: <Landing /> },
    { path: '/splash', element: <Splash /> },
    { path: '/plans', element: <Plans /> },
    { path: '/demo', element: <Demo /> },
    { path: '/triage', element: <Triage /> },
    { path: '/trust', element: <Trust /> },
    { path: '/register', element: <Register /> },
    { path: '/login', element: <Login /> },
    { path: '/admin', element: <Admin /> }
  ],
  protected: [
    { path: '/home', element: <Home /> },
    { path: '/doctors', element: <Doctors /> },
    { path: '/doctor/:id', element: <DoctorProfile /> },
    { path: '/chats', element: <Chats /> },
    { path: '/chat/:id', element: <ChatRoom /> },
    { path: '/emergency', element: <Emergency /> },
    { path: '/profile', element: <Profile /> },
    { path: '/profile/add-relative', element: <AddRelative /> },
    { path: '/confirm', element: <Confirm /> },
    { path: '/payment', element: <Payment /> },
    { path: '/loader', element: <LoaderPage /> },
    { path: '/consultation/:id', element: <Consultation /> },
    { path: '/video-room/:id', element: <VideoRoom /> }
  ],
  doctorOnly: [
    { path: '/doctor', element: <DoctorPanel /> },
    { path: '/doctor/patient/:patientId/laboratory', element: <LaboratoryResearch /> },
    { path: '/doctor/patient/:patientId/instrumental', element: <InstrumentalResearch /> }
  ]
};
