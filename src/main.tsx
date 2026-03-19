import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';
import { useAuthStore } from './store/authStore';
import PharmacistLayout from './components/Layout';
import LoginPage      from './pages/LoginPage';
import HomePage       from './pages/HomePage';
import WarehousePage  from './pages/WarehousePage';
import CartPage       from './pages/CartPage';
import ProfilePage    from './pages/ProfilePage';
import OrdersPage     from './pages/OrdersPage';
import { connectSocket, disconnectSocket } from './services/socket';
import FavoritesPage from './pages/FavoritesPage';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { token, loaded } = useAuthStore();
  if (!loaded) return null;
  if (!token)  return <Navigate to="/login" replace />;
  return <PharmacistLayout>{children}</PharmacistLayout>;
}

function App() {
  const { token, user, loadFromStorage } = useAuthStore();

  useEffect(() => { loadFromStorage(); }, []);

  useEffect(() => {
    if (token && user?.id) {
      const socket = connectSocket(user.id);
      socket.on('notification', (notif: { title: string; message: string }) => {
        toast.info(
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{notif.title}</div>
            <div style={{ fontSize: 13, opacity: .9 }}>{notif.message}</div>
          </div>,
          { autoClose: 6000, icon: '🔔' }
        );
      });
      return () => { socket.off('notification'); disconnectSocket(); };
    }
  }, [token, user?.id]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"            element={<LoginPage />} />
        <Route path="/"                 element={<ProtectedLayout><HomePage /></ProtectedLayout>} />
        <Route path="/warehouse/:id"    element={<ProtectedLayout><WarehousePage /></ProtectedLayout>} />
        <Route path="/cart"             element={<ProtectedLayout><CartPage /></ProtectedLayout>} />
        <Route path="/profile"          element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />
        <Route path="/orders"           element={<ProtectedLayout><OrdersPage /></ProtectedLayout>} />
        <Route path="/favorites"        element={<ProtectedLayout><FavoritesPage /></ProtectedLayout>} />
        <Route path="*"                 element={<Navigate to="/" />} />
      </Routes>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        rtl={true}
        toastStyle={{ fontFamily: 'Cairo, sans-serif', fontSize: 14 }}
      />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);