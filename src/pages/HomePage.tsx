import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import AnnouncementSlider from '../components/AnnouncementSlider';
import { refreshBus } from '../components/Layout';

interface Warehouse {
  id: number; name: string; location: string;
  phone: string; description: string | null; logo: string | null;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user }  = useAuthStore();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);

  useEffect(() => { fetchWarehouses(); }, []);
  useEffect(() => {
    refreshBus.listeners.push(fetchWarehouses);
    return () => { refreshBus.listeners = refreshBus.listeners.filter(fn => fn !== fetchWarehouses); };
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/warehouses?active=true');
      setWarehouses(data);
    } catch { toast.error('خطأ في تحميل المستودعات'); }
    setLoading(false);
  };

  const filtered = warehouses.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🏠 الرئيسية</h1>
          <div className="page-sub">مرحباً {user?.pharmacyName} — اختر شركة للتصفح</div>
        </div>
      </div>

      {/* ── Slider ── */}
      <AnnouncementSlider />

      {/* ── Search ── */}
      <div className="search-bar" style={{ marginBottom: 24 }}>
        <input
          placeholder="🔍 ابحث عن شركة  ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* ── Count ── */}
      <div style={{ fontSize: 13, color: 'var(--tx2)', fontWeight: 600, marginBottom: 16 }}>
        {loading ? '...' : `${filtered.length} شركة / مستودع`}
      </div>

      {/* ── Warehouse cards ── */}
      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏭</div>
          <div className="empty-text">لا توجد نتائج</div>
        </div>
      ) : (
        <div className="warehouses-cards">
          {filtered.map(w => (
            <div
              key={w.id}
              className="warehouse-card"
              onClick={() => navigate(`/warehouse/${w.id}`)}
            >
              {/* Logo */}
              <div className="warehouse-card-logo">
                {w.logo ? (
                  <img src={w.logo} alt={w.name} />
                ) : (
                  <span className="warehouse-card-logo-placeholder">🏭</span>
                )}
              </div>

              {/* Info */}
              <div className="warehouse-card-body">
                <div className="warehouse-card-name">{w.name}</div>
                <div className="warehouse-card-loc">📍 {w.location}</div>
                {w.description && (
                  <div className="warehouse-card-desc">{w.description}</div>
                )}
              </div>

              {/* Arrow */}
              <div className="warehouse-card-arrow">←</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}