import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/common/PrivateRoute/PrivateRoute';
import { routes } from './config/routes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
