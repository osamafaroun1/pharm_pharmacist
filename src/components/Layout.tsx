import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import QrScanner      from './QrScanner';
import QrResultModal  from './QrResultModal';
import PullToRefresh  from './PullToRefresh';
import { IconHome, IconOrders, IconHeart, IconCart, IconUser, IconBarcode, IconLogout } from './Icons';

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
  const handleLogout  = async () => { await logout(); navigate('/login'); };

  return (
    <div className="ph-layout">
      {open && <div className="ph-overlay" onClick={() => setOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`ph-sidebar${open ? ' open' : ''}`}>
        <div className="ph-sidebar-header">
          <div className="ph-logo-icon"><IconPill size={22} /></div>
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
              <span className="ph-nav-icon"><Icon size={20} /></span>
              <span>{label}</span>
              {isCart && cartCount > 0 && <span className="ph-nav-badge">{cartCount}</span>}
            </Link>
          ))}
          <button className="ph-qr-btn" onClick={() => setShowScanner(true)}>
            <span className="ph-nav-icon"><IconBarcode size={20} /></span>
            <span>مسح باركود</span>
          </button>
        </nav>
        <div className="ph-sidebar-footer">
          <button className="ph-logout" onClick={handleLogout}>
            <IconLogout size={16} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ph-main-wrap">
        <header className="ph-topbar">
          <button className="ph-topbar-logout" onClick={handleLogout}>
            <IconLogout size={14} /> خروج
          </button>
          <span className="ph-topbar-title">{currentTitle}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="ph-topbar-qr" onClick={() => setShowScanner(true)}>
              <IconBarcode size={20} />
            </button>
            <Link to="/cart" className="ph-topbar-cart">
              <IconCart size={22} />
              {cartCount > 0 && <span className="ph-topbar-badge">{cartCount}</span>}
            </Link>
          </div>
        </header>

        <PullToRefresh onRefresh={handleRefresh}>
          <main className="ph-content">{children}</main>
        </PullToRefresh>

        <nav className="ph-bottom-nav">
          {NAV.map(({ path, label, Icon, isCart }) => (
            <Link key={path} to={path} className={`ph-bottom-item${loc.pathname === path ? ' active' : ''}`}>
              <span className="ph-bottom-icon">
                <Icon size={22} />
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

// import مؤجل لمنع circular
import { IconPill } from './Icons';