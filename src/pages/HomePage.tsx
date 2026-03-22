import { IconWarehouse } from '../components/Icons';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import AnnouncementSlider from '../components/AnnouncementSlider';
import { refreshBus } from '../components/Layout';
import WarehouseCard from '../components/Cards/WarehouseCard';

export interface Warehouse {
    id: number; name: string; location: string;
    phone: string; description: string | null; logo: string | null;
}

export default function HomePage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    // spinner يشتغل لحظة الكتابة ثم يطفي بعد 300ms تماماً كـ WarehousePage
    const [isSearching, setIsSearching] = useState(false);
    const spinnerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchWarehouses = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/warehouses?active=true');
            setWarehouses(data);
        } catch { toast.error('خطأ في تحميل المستودعات'); }
        setLoading(false);
    };

    useEffect(() => { fetchWarehouses(); }, []);
    useEffect(() => {
        refreshBus.listeners.push(fetchWarehouses);
        return () => { refreshBus.listeners = refreshBus.listeners.filter(fn => fn !== fetchWarehouses); };
    }, []);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (!value) { setIsSearching(false); return; }
        // شغّل الـ spinner فوراً
        setIsSearching(true);
        // أطفئه بعد 300ms (وقت كافٍ ليحس المستخدم بالاستجابة)
        if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
        spinnerTimer.current = setTimeout(() => setIsSearching(false), 300);
    };

    // cleanup عند unmount
    useEffect(() => () => {
        if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
    }, []);

    const filtered = warehouses.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        (w.location || '').toLowerCase().includes(search.toLowerCase())
    );

    const statusText = (() => {
        if (loading)                           return '...';
        if (isSearching)                       return `جاري البحث عن "${search}"...`;
        if (search && filtered.length === 0)   return `لا توجد نتائج لـ "${search}"`;
        if (search)                            return `${filtered.length} نتيجة لـ "${search}"`;
        return `${filtered.length} شركة`;
    })();

    return (
        <>
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">الرئيسية</h1>
                    <div className="page-sub">مرحباً {user?.pharmacyName} — اختر شركة للتصفح</div>
                </div>
            </div>

            {/* ── Slider ── */}
            <AnnouncementSlider />

            {/* ── Search Bar ── */}
            <div
                className="search-bar"
                style={{
                    marginBottom: 14,
                    boxShadow: isSearching ? '0 0 0 2px var(--p)' : undefined,
                    transition: 'box-shadow 0.2s',
                }}
            >
                {/* spinner أو أيقونة بحث — نفس WarehousePage تماماً */}
                <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 20, height: 20, flexShrink: 0,
                    color: isSearching ? 'var(--p)' : 'var(--tx3)',
                    transition: 'color 0.2s',
                }}>
                    {isSearching
                        ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                        : (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <circle cx="11" cy="11" r="7" />
                                <line x1="16.5" y1="16.5" x2="22" y2="22" />
                            </svg>
                        )}
                </span>

                <input
                    placeholder="ابحث عن شركة أو موقع..."
                    value={search}
                    onChange={e => handleSearchChange(e.target.value)}
                    style={{ flex: 1 }}
                />

                {search && (
                    <button
                        className="btn-ghost"
                        onClick={() => { setSearch(''); setIsSearching(false); }}
                        style={{ flexShrink: 0 }}
                        aria-label="مسح البحث"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* ── عداد النتائج ── */}
            <div style={{
                fontSize: 13,
                color: isSearching ? 'var(--p)' : 'var(--tx2)',
                fontWeight: 600,
                marginBottom: 16,
                minHeight: 20,
                transition: 'color 0.2s',
            }}>
                {statusText}
            </div>

            {/* ── Warehouse Cards ── */}
            {loading ? (
                <div className="loading"><div className="spinner" /></div>
            ) : filtered.length === 0 && !isSearching ? (
                <div className="empty-state">
                    <div className="empty-icon" style={{ color: 'var(--tx3)' }}>
                        <IconWarehouse size={40} />
                    </div>
                    <div className="empty-text">لا توجد نتائج لـ "{search}"</div>
                    <button
                        className="btn-ghost"
                        onClick={() => { setSearch(''); setIsSearching(false); }}
                        style={{ marginTop: 10, fontSize: 13 }}
                    >
                        مسح البحث والعودة للكل
                    </button>
                </div>
            ) : (
                <div className="warehouses-cards">
                    {filtered.map(w => (
                        <WarehouseCard
                            key={w.id}
                            warehouse={w}
                            onClick={() => navigate(`/warehouse/${w.id}`)}
                        />
                    ))}
                </div>
            )}
        </>
    );
}