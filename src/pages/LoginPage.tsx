import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [tab, setTab]         = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const { login, register }   = useAuthStore();
  const navigate              = useNavigate();
  const fileRef               = useRef<HTMLInputElement>(null);

  const [loginForm, setLoginForm] = useState({ identity: '', password: '' });

  const [regForm, setRegForm] = useState({
    firstName: '', lastName: '',
    phone: '', landline: '',
    email: '',
    password: '',
    pharmacyName: '',
    pharmacyLocation: '',
    pharmacyLocationDetails: '',
    licenseImage: '',       // base64
    licenseFileName: '',    // عرض اسم الملف فقط
  });

  /* ── تحويل الصورة إلى base64 ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // max 5 MB
    if (file.size > 5 * 1024 * 1024) { toast.error('حجم الصورة يجب أن لا يتجاوز 5 ميغابايت'); return; }
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('يرجى رفع صورة أو ملف PDF فقط'); return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRegForm(prev => ({
        ...prev,
        licenseImage: reader.result as string,
        licenseFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.identity || !loginForm.password) { toast.error('يرجى ملء جميع الحقول'); return; }
    setLoading(true);
    try { await login(loginForm.identity, loginForm.password); toast.success('مرحباً!'); navigate('/'); }
    catch (err: any) { toast.error(err.response?.data?.message || 'خطأ في تسجيل الدخول'); }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.firstName || !regForm.phone || !regForm.password || !regForm.pharmacyName || !regForm.pharmacyLocation) {
      toast.error('يرجى ملء الحقول المطلوبة *'); return;
    }
    setLoading(true);
    try {
      const { licenseFileName, ...payload } = regForm;
      await register(payload);
      toast.success('تم إنشاء الحساب بنجاح!');
      navigate('/');
    } catch (err: any) { toast.error(err.response?.data?.message || 'خطأ في إنشاء الحساب'); }
    setLoading(false);
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 50, marginBottom: 8 }}>💊</div>
          <div className="login-logo">نظام الموزع الدوائي</div>
          <div className="login-sub">بوابة الصيدلاني 🇸🇾</div>
        </div>

        {/* Role switcher */}
        <div style={{ display: 'flex', gap: 8, background: 'var(--bdr2)', borderRadius: 14, padding: 5, marginBottom: 24 }}>
          {[
            { id: 'pharmacist', label: '💊 صيدلي', active: true },
            { id: 'admin',      label: '🔧 أدمن',  active: false },
            { id: 'owner',      label: '👑 مالك',  active: false },
          ].map(r => (
            <div key={r.id}
              style={{ flex: 1, textAlign: 'center', padding: '10px 6px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: r.active ? 'default' : 'pointer', background: r.active ? 'white' : 'transparent', color: r.active ? 'var(--p)' : 'var(--tx3)', boxShadow: r.active ? 'var(--sh0)' : 'none', transition: 'all .2s' }}
              onClick={() => {
                if (r.id === 'admin') window.location.href = 'http://localhost:3002';
                if (r.id === 'owner') window.location.href = 'http://localhost:3003';
              }}
            >
              {r.label}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card">
          <div className="auth-tabs" style={{ marginBottom: 24 }}>
            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>تسجيل دخول</button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>حساب جديد</button>
          </div>

          {/* ══ LOGIN ══ */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="input-wrap">
                <label className="input-label">رقم الهاتف أو البريد الإلكتروني *</label>
                <input className="input-field" placeholder="09xxxxxxxx" value={loginForm.identity}
                  onChange={e => setLoginForm({...loginForm, identity: e.target.value})} />
              </div>
              <div className="input-wrap" style={{ marginBottom: 24 }}>
                <label className="input-label">كلمة المرور *</label>
                <input className="input-field" type="password" placeholder="••••••••" value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'جاري الدخول...' : 'دخول إلى النظام →'}
              </button>
            </form>
          )}

          {/* ══ REGISTER ══ */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>

              {/* ── اسم الصيدلاني ── */}
              <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--tx2)' }}>👤 بيانات الصيدلاني</div>
                <div className="input-row" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="input-label">الاسم الأول *</label>
                    <input className="input-field" placeholder="محمد" value={regForm.firstName}
                      onChange={e => setRegForm({...regForm, firstName: e.target.value})} />
                  </div>
                  <div>
                    <label className="input-label">الاسم الأخير *</label>
                    <input className="input-field" placeholder="أحمد" value={regForm.lastName}
                      onChange={e => setRegForm({...regForm, lastName: e.target.value})} />
                  </div>
                </div>
                <div className="input-row" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="input-label">رقم موبايل *</label>
                    <input className="input-field" placeholder="09xxxxxxxx" value={regForm.phone}
                      onChange={e => setRegForm({...regForm, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="input-label">هاتف ثابت</label>
                    <input className="input-field" placeholder="011-xxxxxxx" value={regForm.landline}
                      onChange={e => setRegForm({...regForm, landline: e.target.value})} />
                  </div>
                </div>
                <div className="input-wrap" style={{ marginBottom: 0 }}>
                  <label className="input-label">البريد الإلكتروني</label>
                  <input className="input-field" type="email" placeholder="email@example.com" value={regForm.email}
                    onChange={e => setRegForm({...regForm, email: e.target.value})} />
                </div>
              </div>

              {/* ── بيانات الصيدلية ── */}
              <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--tx2)' }}>🏥 بيانات الصيدلية</div>
                <div className="input-wrap">
                  <label className="input-label">اسم الصيدلية *</label>
                  <input className="input-field" placeholder="صيدلية الشفاء" value={regForm.pharmacyName}
                    onChange={e => setRegForm({...regForm, pharmacyName: e.target.value})} />
                </div>
                <div className="input-wrap">
                  <label className="input-label">موقع الصيدلية (المنطقة) *</label>
                  <input className="input-field" placeholder="دمشق - المزة" value={regForm.pharmacyLocation}
                    onChange={e => setRegForm({...regForm, pharmacyLocation: e.target.value})} />
                </div>
                <div className="input-wrap" style={{ marginBottom: 0 }}>
                  <label className="input-label">تفاصيل الموقع</label>
                  <textarea className="input-field" rows={3} placeholder="مقابل مدرسة... شارع... بناء رقم... طابق..." value={regForm.pharmacyLocationDetails}
                    onChange={e => setRegForm({...regForm, pharmacyLocationDetails: e.target.value})}
                    style={{ resize: 'vertical', minHeight: 80 }} />
                </div>
              </div>

              {/* ── صورة الشهادة ── */}
              <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--tx2)' }}>📋 شهادة الصيدلية</div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileChange} />
                {!regForm.licenseImage ? (
                  <button type="button"
                    style={{ width: '100%', padding: '20px 16px', border: '2px dashed var(--bdr)', borderRadius: 'var(--r2)', background: 'white', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}
                    onClick={() => fileRef.current?.click()}
                    onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--p)')}
                    onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--bdr)')}
                  >
                    <div style={{ fontSize: 32, marginBottom: 6 }}>📂</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx2)' }}>اضغط لرفع صورة الشهادة</div>
                    <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>صورة أو PDF • حد أقصى 5 ميغابايت</div>
                  </button>
                ) : (
                  <div style={{ border: '2px solid var(--p)', borderRadius: 'var(--r2)', padding: 12, background: 'var(--pf)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {regForm.licenseImage.startsWith('data:image') ? (
                      <img src={regForm.licenseImage} alt="شهادة" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 60, height: 60, background: 'var(--pl)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📄</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--pd)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✅ {regForm.licenseFileName}</div>
                      <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>تم رفع الملف بنجاح</div>
                    </div>
                    <button type="button"
                      style={{ background: '#fee2e2', color: 'var(--red)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}
                      onClick={() => { setRegForm(p => ({...p, licenseImage: '', licenseFileName: ''})); if (fileRef.current) fileRef.current.value = ''; }}
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>

              {/* ── كلمة المرور ── */}
              <div className="input-wrap" style={{ marginBottom: 24 }}>
                <label className="input-label">كلمة المرور *</label>
                <input className="input-field" type="password" placeholder="8 أحرف على الأقل" value={regForm.password}
                  onChange={e => setRegForm({...regForm, password: e.target.value})} />
              </div>

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب →'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--tx3)', marginTop: 20 }}>
            © 2026 نظام الموزع الدوائي – سوريا
          </p>
        </div>
      </div>
    </div>
  );
}