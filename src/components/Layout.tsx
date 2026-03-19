import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import QrScanner      from './QrScanner';
import QrResultModal  from './QrResultModal';
import PullToRefresh  from './PullToRefresh';

// ── SVG Icons ──
const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconOrders = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconHeart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IconCart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IconUser = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconBarcode = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5v4M3 3h4M21 3h-4M21 5v4M3 19v-4M3 21h4M21 21h-4M21 19v-4"/>
    <line x1="7"  y1="8" x2="7"  y2="16"/>
    <line x1="10" y1="8" x2="10" y2="16"/>
    <line x1="13" y1="8" x2="13" y2="16"/>
    <line x1="16" y1="9" x2="16" y2="16"/>
  </svg>
);

const NAV = [
  { path: '/',          label: 'الرئيسية', Icon: IconHome,   isCart: false },
  { path: '/orders',    label: 'طلباتي',   Icon: IconOrders, isCart: false },
  { path: '/favorites', label: 'المفضلة',  Icon: IconHeart,  isCart: false },
  { path: '/cart',      label: 'السلة',    Icon: IconCart,   isCart: true  },
  { path: '/profile',   label: 'حسابي',    Icon: IconUser,   isCart: false },
];

export const refreshBus = { listeners: [] as (() => void)[], emit() { this.listeners.forEach(fn => fn()); } };

export default function PharmacistLayout({ children }: { children: React.ReactNode }) {
  const loc      = useLocation();
  const navigate = useNavigate();
  const { user, logout }  = useAuthStore();
  const { items }         = useCartStore();
  const [open,        setOpen]        = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const cartCount    = items.reduce((s, i) => s + i.quantity, 0);
  const currentTitle = NAV.find(n => n.path === loc.pathname)?.label ?? 'الرئيسية';

  useEffect(() => setOpen(false), [loc.pathname]);

  const onResize = useCallback(() => { if (window.innerWidth >= 900) setOpen(false); }, []);
  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [onResize]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleScan    = (barcode: string) => { setShowScanner(false); setScannedCode(barcode); };
  const handleRefresh = async () => { await new Promise(r => setTimeout(r, 300)); refreshBus.emit(); };

  return (
    <div className="ph-layout">
      {open && <div className="ph-overlay" onClick={() => setOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`ph-sidebar${open ? ' open' : ''}`}>
        <div className="ph-sidebar-header">
          <div className="ph-logo-icon">💊</div>
          <div>
            <div className="ph-logo-text">الموزع الدوائي</div>
            <div className="ph-logo-sub">بوابة الصيدلاني</div>
          </div>
        </div>
        <div className="ph-sidebar-user">
          <div className="ph-sidebar-av">{user?.firstName?.charAt(0)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="ph-sidebar-uname">{user?.firstName} {user?.lastName}</div>
            <div className="ph-sidebar-usub">{user?.pharmacyName}</div>
          </div>
        </div>
        <nav className="ph-sidebar-nav">
          {NAV.map(({ path, label, Icon, isCart }) => (
            <Link key={path} to={path} className={`ph-nav-link${loc.pathname === path ? ' active' : ''}`}>
              <span className="ph-nav-icon"><Icon /></span>
              <span>{label}</span>
              {isCart && cartCount > 0 && <span className="ph-nav-badge">{cartCount}</span>}
            </Link>
          ))}
          <button className="ph-qr-btn" onClick={() => setShowScanner(true)}>
            <span className="ph-nav-icon"><IconBarcode /></span>
            <span>مسح باركود</span>
          </button>
        </nav>
        <div className="ph-sidebar-footer">
          <button className="ph-logout" onClick={() => { logout(); navigate('/login'); }}>
            🚪 تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ph-main-wrap">
        {/* Topbar */}
        <header className="ph-topbar">
          <button className="ph-topbar-logout" onClick={() => { logout(); navigate('/login'); }}>خروج</button>
          <span className="ph-topbar-title">{currentTitle}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="ph-topbar-qr" onClick={() => setShowScanner(true)} title="مسح باركود">
              <IconBarcode />
            </button>
            <Link to="/cart" className="ph-topbar-cart">
              <IconCart />
              {cartCount > 0 && <span className="ph-topbar-badge">{cartCount}</span>}
            </Link>
          </div>
        </header>

        {/* Content */}
        <PullToRefresh onRefresh={handleRefresh}>
          <main className="ph-content">{children}</main>
        </PullToRefresh>

        {/* Bottom nav */}
        <nav className="ph-bottom-nav">
          {NAV.map(({ path, label, Icon, isCart }) => (
            <Link key={path} to={path} className={`ph-bottom-item${loc.pathname === path ? ' active' : ''}`}>
              <span className="ph-bottom-icon">
                <Icon />
                {isCart && cartCount > 0 && <span className="ph-bottom-badge">{cartCount}</span>}
              </span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {showScanner && <QrScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      {scannedCode  && <QrResultModal barcode={scannedCode} onClose={() => setScannedCode(null)} />}
    </div>
  );
}