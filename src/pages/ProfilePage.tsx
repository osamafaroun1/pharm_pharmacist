import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

// ── SVG Icons ──
const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconPharmacy = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconLock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconOrders = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
const IconCalendar = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconMoney = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const IconStar = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const IconPhone = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 8.5 8.5l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 18.43z" /></svg>;
const IconPin = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const IconLogout = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const IconSave = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;
const IconUpload = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
const IconFile = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
const IconTrophy = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 17 16 21" /><line x1="12" y1="17" x2="12" y2="11" /><path d="M7 4V2H17V4" /><path d="M7 4C7 4 4 6 4 10C4 12 5 14 7 15L12 11L17 15C19 14 20 12 20 10C20 6 17 4 17 4" /></svg>;

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, updateProfile, logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [tab, setTab] = useState<'info' | 'pharmacy' | 'security'>('info');
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        landline: user?.landline || '',
        email: user?.email || '',
        pharmacyName: user?.pharmacyName || '',
        pharmacyLocation: user?.pharmacyLocation || '',
        pharmacyLocationDetails: user?.pharmacyLocationDetails || '',
        licenseImage: user?.licenseImage || '',
        licenseFileName: user?.licenseImage ? 'الشهادة المحفوظة' : '',
        password: '',
        passwordConfirm: '',
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
        api.get('/my-stats').then(r => setStats(r.data)).catch(() => { });
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
            if (!payload.licenseImage && user?.licenseImage) delete (payload as any).licenseImage;
            await updateProfile(payload);
            toast.success('تم تحديث البيانات بنجاح');
        } catch (err: any) { toast.error(err.response?.data?.message || 'خطأ في التحديث'); }
        setLoading(false);
    };

    const TABS = [
        { id: 'info', label: 'بياناتي', Icon: IconUser },
        { id: 'pharmacy', label: 'الصيدلية', Icon: IconPharmacy },
        { id: 'security', label: 'الأمان', Icon: IconLock },
    ];

    const STATS = [
        { label: 'طلباتي', value: stats?.totalOrders, Icon: IconOrders, highlight: false },
        { label: 'هذا الشهر', value: stats?.monthOrders, Icon: IconCalendar, highlight: false },
        { label: 'مشترياتي', value: stats ? new Intl.NumberFormat('ar-SY').format(stats.totalSpent) + ' ل.س' : null, Icon: IconMoney, highlight: false, small: true },
        { label: 'نقاطي', value: stats?.points, Icon: IconStar, highlight: true },
    ];

    return (
        <>
            {/* ── Header ── */}
            <div className="page-header">
                <h1 className="page-title">الملف الشخصي</h1>
        
            </div>

            {/* ── Profile card ── */}
            <div className="profile-header" style={{ marginBottom: 20 }}>
                <div className="profile-av">{user?.firstName?.charAt(0)}</div>
                <div>
                    <div className="profile-name">{user?.firstName} {user?.lastName}</div>
                    <div className="profile-pharmacy" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" /></svg>
                        {user?.pharmacyName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconPhone /> {user?.phone}
                        {user?.landline && <><span style={{ margin: '0 4px' }}>•</span><IconPhone /> {user.landline}</>}
                    </div>
                    {user?.pharmacyLocation && (
                        <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IconPin /> {user.pharmacyLocation}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Stats ── */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                    {STATS.map((s, i) => s.value != null && (
                        <div key={i} style={{ background: s.highlight ? 'linear-gradient(135deg,#0f172a,#1e293b)' : 'var(--surf)', borderRadius: 'var(--r2)', padding: '12px 8px', textAlign: 'center', boxShadow: 'var(--sh1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: s.highlight ? '#f59e0b' : 'var(--p)' }}>
                                <s.Icon />
                            </div>
                            <div style={{ fontWeight: 900, fontSize: s.small ? 11 : 17, color: s.highlight ? '#f59e0b' : 'var(--p)', lineHeight: 1.2 }}>{s.value}</div>
                            <div style={{ fontSize: 10, color: s.highlight ? 'rgba(255,255,255,0.5)' : 'var(--tx3)', marginTop: 3 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* أكثر المنتجات */}
            {stats?.topProducts?.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--tx)' }}>
                        <IconTrophy /> أكثر ما تطلبه
                    </div>
                    {stats.topProducts.map((p: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < stats.topProducts.length - 1 ? '1px solid var(--bdr2)' : 'none' }}>
                            <span style={{ fontWeight: 700, color: 'var(--p)', fontSize: 13 }}>{p.count} وحدة</span>
                            <span style={{ fontSize: 13 }}>{p.name}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--bdr2)', borderRadius: 'var(--r2)', padding: 4, marginBottom: 20 }}>
                {TABS.map(({ id, label, Icon }) => (
                    <button key={id}
                        style={{ flex: 1, padding: '10px 6px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all .2s', background: tab === id ? 'white' : 'transparent', color: tab === id ? 'var(--p)' : 'var(--tx2)', boxShadow: tab === id ? 'var(--sh0)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                        onClick={() => setTab(id as any)}
                    >
                        <Icon /> {label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSave}>

                {/* ══ بياناتي ══ */}
                {tab === 'info' && (
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}>البيانات الشخصية</div>
                        <div className="input-row" style={{ marginBottom: 14 }}>
                            <div>
                                <label className="input-label">الاسم الأول</label>
                                <input className="input-field" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                            </div>
                            <div>
                                <label className="input-label">الاسم الأخير</label>
                                <input className="input-field" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                            </div>
                        </div>
                        <div className="input-row" style={{ marginBottom: 14 }}>
                            <div>
                                <label className="input-label">رقم الموبايل</label>
                                <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="input-label">هاتف ثابت</label>
                                <input className="input-field" placeholder="011-xxxxxxx" value={form.landline} onChange={e => setForm({ ...form, landline: e.target.value })} />
                            </div>
                        </div>
                        <div className="input-wrap">
                            <label className="input-label">البريد الإلكتروني</label>
                            <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        </div>
                    </div>
                )}

                {/* ══ الصيدلية ══ */}
                {tab === 'pharmacy' && (
                    <>
                        <div className="card" style={{ marginBottom: 16 }}>
                            <div className="card-title" style={{ marginBottom: 16 }}>بيانات الصيدلية</div>
                            <div className="input-wrap">
                                <label className="input-label">اسم الصيدلية</label>
                                <input className="input-field" value={form.pharmacyName} onChange={e => setForm({ ...form, pharmacyName: e.target.value })} />
                            </div>
                            <div className="input-wrap">
                                <label className="input-label">المنطقة</label>
                                <input className="input-field" placeholder="دمشق - المزة" value={form.pharmacyLocation} onChange={e => setForm({ ...form, pharmacyLocation: e.target.value })} />
                            </div>
                            <div className="input-wrap" style={{ marginBottom: 0 }}>
                                <label className="input-label">تفاصيل الموقع</label>
                                <textarea className="input-field" rows={3} placeholder="مقابل... شارع... بناء..." value={form.pharmacyLocationDetails}
                                    onChange={e => setForm({ ...form, pharmacyLocationDetails: e.target.value })}
                                    style={{ resize: 'vertical', minHeight: 80 }} />
                            </div>
                        </div>

                        <div className="card" style={{ marginBottom: 16 }}>
                            <div className="card-title" style={{ marginBottom: 14 }}>شهادة مزاولة المهنة</div>
                            <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileChange} />
                            {!form.licenseImage ? (
                                <button type="button"
                                    onClick={() => fileRef.current?.click()}
                                    style={{ width: '100%', padding: '24px 16px', border: '2px dashed var(--bdr)', borderRadius: 'var(--r2)', background: 'var(--s2)', cursor: 'pointer', textAlign: 'center' }}
                                    onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--p)')}
                                    onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--bdr)')}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: 'var(--tx3)' }}><IconUpload /></div>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx2)' }}>اضغط لرفع الشهادة</div>
                                    <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>صورة أو PDF — حد أقصى 5MB</div>
                                </button>
                            ) : (
                                <div style={{ border: '2px solid var(--p)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                                    {form.licenseImage.startsWith('data:image') ? (
                                        <img src={form.licenseImage} alt="شهادة" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', background: '#f8f8f8', display: 'block' }} />
                                    ) : (
                                        <div style={{ padding: 20, background: 'var(--pf)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ color: 'var(--pd)' }}><IconFile /></div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--pd)', fontSize: 13 }}>{form.licenseFileName}</div>
                                                <div style={{ fontSize: 12, color: 'var(--tx2)' }}>ملف PDF</div>
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ padding: '10px 14px', background: 'var(--pf)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <button type="button"
                                            style={{ background: '#fee2e2', color: 'var(--red)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                                            onClick={() => { setForm(p => ({ ...p, licenseImage: '', licenseFileName: '' })); if (fileRef.current) fileRef.current.value = ''; }}>
                                            حذف
                                        </button>
                                        <button type="button"
                                            style={{ background: 'var(--pl)', color: 'var(--pd)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                                            onClick={() => fileRef.current?.click()}>
                                            تغيير
                                        </button>
                                        <span style={{ fontSize: 12, color: 'var(--pd)', fontWeight: 600 }}>تم الرفع</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ══ الأمان ══ */}
                {tab === 'security' && (
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}>تغيير كلمة المرور</div>
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--r1)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
                            اتركها فارغة إذا لم تريد التغيير
                        </div>
                        <div className="input-wrap">
                            <label className="input-label">كلمة المرور الجديدة</label>
                            <input className="input-field" type="password" placeholder="8 أحرف على الأقل" value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })} />
                        </div>
                        <div className="input-wrap" style={{ marginBottom: 0 }}>
                            <label className="input-label">تأكيد كلمة المرور</label>
                            <input className="input-field" type="password" placeholder="أعد كتابة كلمة المرور"
                                value={form.passwordConfirm}
                                onChange={e => setForm({ ...form, passwordConfirm: e.target.value })}
                                style={{ borderColor: form.password && form.passwordConfirm && form.password !== form.passwordConfirm ? 'var(--red)' : '' }} />
                            {form.password && form.passwordConfirm && form.password !== form.passwordConfirm && (
                                <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>كلمتا المرور غير متطابقتين</div>
                            )}
                        </div>
                    </div>
                )}

                <button className="btn-primary" type="submit" disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                    {loading
                        ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> جاري الحفظ...</>
                        : <><IconSave /> حفظ التغييرات</>
                    }
                </button>
            </form>
        </>
    );
}