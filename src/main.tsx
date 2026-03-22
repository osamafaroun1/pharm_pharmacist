import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';
import { useAuthStore } from './store/authStore';
import PharmacistLayout from './components/Layout';
import LoginPage     from './pages/LoginPage';
import HomePage      from './pages/HomePage';
import WarehousePage from './pages/WarehousePage';
import CartPage      from './pages/CartPage';
import ProfilePage   from './pages/ProfilePage';
import OrdersPage    from './pages/OrdersPage';
import FavoritesPage from './pages/FavoritesPage';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { token, loaded } = useAuthStore();
  if (!loaded) return null;
  if (!token)  return <Navigate to="/login" replace />;
  return <PharmacistLayout>{children}</PharmacistLayout>;
}

function App() {
  const { loadFromStorage } = useAuthStore();
  useEffect(() => { loadFromStorage(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/"              element={<ProtectedLayout><HomePage /></ProtectedLayout>} />
        <Route path="/warehouse/:id" element={<ProtectedLayout><WarehousePage /></ProtectedLayout>} />
        <Route path="/cart"          element={<ProtectedLayout><CartPage /></ProtectedLayout>} />
        <Route path="/profile"       element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />
        <Route path="/orders"        element={<ProtectedLayout><OrdersPage /></ProtectedLayout>} />
        <Route path="/favorites"     element={<ProtectedLayout><FavoritesPage /></ProtectedLayout>} />
        <Route path="*"              element={<Navigate to="/" />} />
      </Routes>
      <ToastContainer
        position="top-center"
        autoClose={2500}
        rtl={true}
        toastStyle={{ fontFamily: 'Cairo, sans-serif', fontSize: 14 }}
      />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);