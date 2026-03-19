import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [stats,   setStats]   = useState<any>(null);
  const [tab, setTab]         = useState<'info' | 'pharmacy' | 'security'>('info');
  const fileRef               = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName:               user?.firstName               || '',
    lastName:                user?.lastName                || '',
    phone:                   user?.phone                   || '',
    landline:                user?.landline                || '',
    email:                   user?.email                   || '',
    pharmacyName:            user?.pharmacyName            || '',
    pharmacyLocation:        user?.pharmacyLocation        || '',
    pharmacyLocationDetails: user?.pharmacyLocationDetails || '',
    licenseImage:            user?.licenseImage            || '',
    licenseFileName:         user?.licenseImage ? 'الشهادة المحفوظة' : '',
    password:                '',
    passwordConfirm:         '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('حجم الملف يجب أن لا يتجاوز 5 ميغابايت'); return; }
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') { toast.error('يرجى رفع صورة أو PDF فقط'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, licenseImage: reader.result as string, licenseFileName: file.name }));
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    api.get('/my-stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'security' && form.password && form.password !== form.passwordConfirm) {
      toast.error('كلمتا المرور غير متطابقتان'); return;
    }
    setLoading(true);
    try {
      const { licenseFileName, passwordConfirm, ...payload } = form;
      if (!payload.password) delete (payload as any).password;
      if (!payload.licenseImage && user?.licenseImage) delete (payload as any).licenseImage; // keep old
      await updateProfile(payload);
      toast.success('✅ تم تحديث البيانات بنجاح');
    } catch (err: any) { toast.error(err.response?.data?.message || 'خطأ في التحديث'); }
    setLoading(false);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">👤 الملف الشخصي</h1>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{ background: '#fee2e2', color: 'var(--red)', border: '1px solid #fecaca', padding: '8px 18px', borderRadius: 'var(--r1)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          🚪 تسجيل الخروج
        </button>
      </div>

      {/* ── Profile header ── */}
      <div className="profile-header" style={{ marginBottom: 24 }}>
        <div className="profile-av">{user?.firstName?.charAt(0)}</div>
        <div>
          <div className="profile-name">{user?.firstName} {user?.lastName}</div>
          <div className="profile-pharmacy">💊 {user?.pharmacyName}</div>
          <div className="profile-phone">📱 {user?.phone}{user?.landline && ` • ☎️ ${user.landline}`}</div>
          {user?.pharmacyLocation && <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>📍 {user.pharmacyLocation}</div>}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bdr2)', borderRadius: 'var(--r2)', padding: 4, marginBottom: 24 }}>
        {[
          { id: 'info',     label: '👤 بياناتي' },
          { id: 'pharmacy', label: '🏥 الصيدلية' },
          { id: 'security', label: '🔒 الأمان' },
        ].map(t => (
          <button key={t.id}
            style={{ flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all .2s', background: tab === t.id ? 'white' : 'transparent', color: tab === t.id ? 'var(--p)' : 'var(--tx2)', boxShadow: tab === t.id ? 'var(--sh0)' : 'none' }}
            onClick={() => setTab(t.id as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── إحصائيات + نقاط ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { icon: '📋', label: 'طلباتي', value: stats.totalOrders },
            { icon: '📅', label: 'هذا الشهر', value: stats.monthOrders },
            { icon: '💰', label: 'مشترياتي', value: new Intl.NumberFormat('ar-SY').format(stats.totalSpent) + ' ل.س', small: true },
            { icon: '⭐', label: 'نقاطي', value: stats.points, highlight: true },
          ].map((s, i) => (
            <div key={i} style={{ background: s.highlight ? 'linear-gradient(135deg,#0f172a,#1e293b)' : 'var(--surf)', borderRadius: 'var(--r2)', padding: '14px 12px', textAlign: 'center', boxShadow: 'var(--sh1)' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontWeight: 900, fontSize: s.small ? 13 : 20, color: s.highlight ? '#f59e0b' : 'var(--p)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: s.highlight ? 'rgba(255,255,255,0.6)' : 'var(--tx2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* أكثر المنتجات طلباً */}
      {stats?.topProducts?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>🏆 أكثر ما تطلبه</div>
          {stats.topProducts.map((p: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < stats.topProducts.length - 1 ? '1px solid var(--bdr2)' : 'none' }}>
              <span style={{ fontWeight: 700, color: 'var(--p)', fontSize: 13 }}>{p.count} وحدة</span>
              <span style={{ fontSize: 13 }}>{p.name}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSave}>

        {/* ══ TAB: بياناتي ══ */}
        {tab === 'info' && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 18 }}>البيانات الشخصية</div>
            <div className="input-row" style={{ marginBottom: 14 }}>
              <div>
                <label className="input-label">الاسم الأول *</label>
                <input className="input-field" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
              </div>
              <div>
                <label className="input-label">الاسم الأخير *</label>
                <input className="input-field" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
              </div>
            </div>
            <div className="input-row" style={{ marginBottom: 14 }}>
              <div>
                <label className="input-label">رقم الموبايل *</label>
                <input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div>
                <label className="input-label">هاتف ثابت</label>
                <input className="input-field" placeholder="011-xxxxxxx" value={form.landline} onChange={e => setForm({...form, landline: e.target.value})} />
              </div>
            </div>
            <div className="input-wrap">
              <label className="input-label">البريد الإلكتروني</label>
              <input className="input-field" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>
        )}

        {/* ══ TAB: الصيدلية ══ */}
        {tab === 'pharmacy' && (
          <>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 18 }}>بيانات الصيدلية</div>
              <div className="input-wrap">
                <label className="input-label">اسم الصيدلية *</label>
                <input className="input-field" value={form.pharmacyName} onChange={e => setForm({...form, pharmacyName: e.target.value})} />
              </div>
              <div className="input-wrap">
                <label className="input-label">موقع الصيدلية (المنطقة) *</label>
                <input className="input-field" placeholder="دمشق - المزة" value={form.pharmacyLocation} onChange={e => setForm({...form, pharmacyLocation: e.target.value})} />
              </div>
              <div className="input-wrap" style={{ marginBottom: 0 }}>
                <label className="input-label">تفاصيل الموقع</label>
                <textarea className="input-field" rows={3} placeholder="مقابل... شارع... بناء... طابق..." value={form.pharmacyLocationDetails}
                  onChange={e => setForm({...form, pharmacyLocationDetails: e.target.value})}
                  style={{ resize: 'vertical', minHeight: 80 }} />
              </div>
            </div>

            {/* License image */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 14 }}>📋 شهادة مزاولة المهنة</div>
              <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileChange} />

              {!form.licenseImage ? (
                <button type="button"
                  style={{ width: '100%', padding: '22px 16px', border: '2px dashed var(--bdr)', borderRadius: 'var(--r2)', background: 'var(--s2)', cursor: 'pointer', textAlign: 'center', transition: 'border-color .2s' }}
                  onClick={() => fileRef.current?.click()}
                  onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--p)')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--bdr)')}
                >
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx2)' }}>اضغط لرفع شهادة الصيدلية</div>
                  <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>صورة أو PDF • حد أقصى 5 ميغابايت</div>
                </button>
              ) : (
                <div style={{ border: '2px solid var(--p)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  {form.licenseImage.startsWith('data:image') || (form.licenseImage.startsWith('http') && !form.licenseImage.endsWith('.pdf')) ? (
                    <img src={form.licenseImage} alt="شهادة" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', background: '#000', display: 'block' }} />
                  ) : (
                    <div style={{ padding: 20, background: 'var(--pf)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 40 }}>📄</div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--pd)' }}>{form.licenseFileName}</div>
                        <div style={{ fontSize: 12, color: 'var(--tx2)' }}>ملف PDF محفوظ</div>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '10px 14px', background: 'var(--pf)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button type="button"
                      style={{ background: '#fee2e2', color: 'var(--red)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                      onClick={() => { setForm(p => ({...p, licenseImage: '', licenseFileName: ''})); if (fileRef.current) fileRef.current.value = ''; }}
                    >
                      🗑 حذف
                    </button>
                    <button type="button"
                      style={{ background: 'var(--pl)', color: 'var(--pd)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                      onClick={() => fileRef.current?.click()}
                    >
                      🔄 تغيير
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--pd)', fontWeight: 600 }}>✅ تم رفع الشهادة</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ TAB: الأمان ══ */}
        {tab === 'security' && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 18 }}>تغيير كلمة المرور</div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--r1)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
              ⚠️ اتركها فارغة إذا لم تريد تغيير كلمة المرور
            </div>
            <div className="input-wrap">
              <label className="input-label">كلمة المرور الجديدة</label>
              <input className="input-field" type="password" placeholder="8 أحرف على الأقل" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <div className="input-wrap" style={{ marginBottom: 0 }}>
              <label className="input-label">تأكيد كلمة المرور</label>
              <input className="input-field" type="password" placeholder="أعد كتابة كلمة المرور"
                value={form.passwordConfirm}
                onChange={e => setForm({...form, passwordConfirm: e.target.value})}
                style={{ borderColor: form.password && form.passwordConfirm && form.password !== form.passwordConfirm ? 'var(--red)' : '' }} />
              {form.password && form.passwordConfirm && form.password !== form.passwordConfirm && (
                <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>❌ كلمتا المرور غير متطابقتين</div>
              )}
            </div>
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? 'جاري الحفظ...' : '💾 حفظ التغييرات'}
        </button>
      </form>
    </>
  );
}