import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UsersDashboard from './pages/Users/UsersDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/Users/Dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Faculty', 'Chairperson', 'Department Head', 'Dean']}>
              <UsersDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/unauthorized" element={
          <div className="h-screen w-screen flex flex-col items-center justify-center text-center p-6 bg-slate-50">
            <h1 className="text-2xl font-black text-rose-500 font-montserrat">Access Denied</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Your registered user role profile does not hold permissions to look through this administrative master console matrix.
            </p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
