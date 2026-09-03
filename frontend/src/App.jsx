import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import POS from './pages/POS.jsx';
import Inventory from './pages/Inventory.jsx';
import Customers from './pages/Customers.jsx';
import Returns from './pages/Returns.jsx';
import SalesHistory from './pages/SalesHistory.jsx';
import CashRegister from './pages/CashRegister.jsx';
import Reports from './pages/Reports.jsx';
import Users from './pages/Users.jsx';
import TaxAndDiscounts from './pages/TaxAndDiscounts.jsx';
import Promotions from './pages/Promotions.jsx';
import Settings from './pages/Settings.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/pos"
        element={
          <ProtectedRoute roles={['administrador', 'supervisor', 'cajero']}>
            <POS />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute roles={['administrador', 'supervisor']}>
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute roles={['administrador', 'supervisor', 'cajero']}>
            <Customers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/returns"
        element={
          <ProtectedRoute roles={['administrador', 'supervisor']}>
            <Returns />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cash-register"
        element={
          <ProtectedRoute roles={['administrador', 'supervisor', 'cajero']}>
            <CashRegister />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales-history"
        element={
          <ProtectedRoute roles={['administrador', 'supervisor']}>
            <SalesHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={['administrador', 'supervisor']}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tax-discounts"
        element={
          <ProtectedRoute roles={['administrador']}>
            <TaxAndDiscounts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/promotions"
        element={
          <ProtectedRoute roles={['administrador', 'supervisor']}>
            <Promotions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={['administrador']}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute roles={['administrador', 'supervisor', 'cajero']}>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/pos" replace />} />
    </Routes>
  );
}
