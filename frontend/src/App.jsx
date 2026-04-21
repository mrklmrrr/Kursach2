import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/common/PrivateRoute/PrivateRoute';
import OnboardingGate from './components/features/OnboardingGate/OnboardingGate';
import { routes } from './config/routes';

function App() {
  return (
    <BrowserRouter>
      <OnboardingGate />
      <Routes>
        {/* Public routes */}
        {routes.public.map((route) => (
          <Route key={route.path} {...route} />
        ))}

        {/* Protected routes - patient */}
        {routes.protected.map((route) => (
          <Route
            key={route.path}
            {...route}
            element={<PrivateRoute>{route.element}</PrivateRoute>}
          />
        ))}

        {/* Protected routes - doctor only */}
        {routes.doctorOnly.map((route) => (
          <Route
            key={route.path}
            {...route}
            element={<PrivateRoute roles={['doctor']}>{route.element}</PrivateRoute>}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
