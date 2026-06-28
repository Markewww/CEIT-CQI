import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import AdminDashboard from './pages/Admin/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Landing on the root URL automatically loads the Login page */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* 2. Route for your app dashboard post-login */}
        <Route path="/dashboard" element={<AdminDashboard />} />
        
        {/* 3. Safety Catch-all: Redirects any typos or broken links back to / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
