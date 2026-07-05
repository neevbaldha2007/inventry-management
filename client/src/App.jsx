import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ResetPassword from './pages/auth/ResetPassword';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/products/ProductList';
import Categories from './pages/products/Categories';
import Receipts from './pages/operations/Receipts';
import ReceiptForm from './pages/operations/ReceiptForm';
import DeliveryOrders from './pages/operations/DeliveryOrders';
import DeliveryForm from './pages/operations/DeliveryForm';
import InternalTransfers from './pages/operations/InternalTransfers';
import TransferForm from './pages/operations/TransferForm';
import StockAdjustments from './pages/operations/StockAdjustments';
import AdjustmentForm from './pages/operations/AdjustmentForm';
import MoveHistory from './pages/MoveHistory';
import Warehouses from './pages/settings/Warehouses';
import Profile from './pages/settings/Profile';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page"><div className="text-muted">Loading...</div></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page"><div className="text-muted">Loading...</div></div>;
  return !user ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#f0f0f5',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '0.9rem',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
          <Route path="/reset-password" element={<AuthRoute><ResetPassword /></AuthRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductList />} />
            <Route path="categories" element={<Categories />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="receipts/new" element={<ReceiptForm />} />
            <Route path="receipts/:id" element={<ReceiptForm />} />
            <Route path="deliveries" element={<DeliveryOrders />} />
            <Route path="deliveries/new" element={<DeliveryForm />} />
            <Route path="deliveries/:id" element={<DeliveryForm />} />
            <Route path="transfers" element={<InternalTransfers />} />
            <Route path="transfers/new" element={<TransferForm />} />
            <Route path="transfers/:id" element={<TransferForm />} />
            <Route path="adjustments" element={<StockAdjustments />} />
            <Route path="adjustments/new" element={<AdjustmentForm />} />
            <Route path="adjustments/:id" element={<AdjustmentForm />} />
            <Route path="move-history" element={<MoveHistory />} />
            <Route path="warehouses" element={<Warehouses />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
