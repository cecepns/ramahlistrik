import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminServices } from './pages/AdminServices';
import { AdminTechnicians } from './pages/AdminTechnicians';
import { AdminCustomers } from './pages/AdminCustomers';
import { AdminDeposits } from './pages/AdminDeposits';
import { AdminSettings } from './pages/AdminSettings';
import { OrdersList } from './pages/OrdersList';
import { TechnicianDashboard } from './pages/TechnicianDashboard';
import { TechnicianSettings } from './pages/TechnicianSettings';
import { TechnicianDeposits } from './pages/TechnicianDeposits';
import { CustomerCreateOrder } from './pages/CustomerCreateOrder';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

export function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/layanan" element={<LandingPage defaultSection="layanan" />} />
      <Route path="/cara-kerja" element={<LandingPage defaultSection="cara-kerja" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage isTechnician={false} />} />
      <Route path="/register-technician" element={<RegisterPage isTechnician={true} />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminServices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/technicians"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminTechnicians />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCustomers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <OrdersList role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/deposits"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDeposits />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      {/* Technician Routes */}
      <Route
        path="/technician/dashboard"
        element={
          <ProtectedRoute allowedRoles={['technician']}>
            <TechnicianDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician/orders"
        element={
          <ProtectedRoute allowedRoles={['technician']}>
            <OrdersList role="technician" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician/deposits"
        element={
          <ProtectedRoute allowedRoles={['technician']}>
            <TechnicianDeposits />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician/settings"
        element={
          <ProtectedRoute allowedRoles={['technician']}>
            <TechnicianSettings />
          </ProtectedRoute>
        }
      />

      {/* Customer Routes */}
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <OrdersList role="customer" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/create-order"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerCreateOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/orders"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <OrdersList role="customer" />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
