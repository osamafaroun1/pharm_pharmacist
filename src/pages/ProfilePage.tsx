import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { 
    IconFile_PharmProfile, IconLock_PharmProfile, IconPharmacy_PharmProfile, 
    IconPhone_PharmProfile, IconPin_PharmProfile, IconSave_PharmProfile, 
    IconUpload_PharmProfile, IconUser_PharmProfile 
} from '../components/Icons';

// Schema للتحقق من البيانات الشخصية
const infoSchema = z.object({
    firstName: z.string().min(2, "الاسم الأول يجب أن يكون 2 أحرف على الأقل").max(50, "الاسم الأول طويل جداً"),
    lastName: z.string().min(2, "الاسم الأخير يجب أن يكون 2 أحرف على الأقل").max(50, "الاسم الأخير طويل جداً"),
    phone: z.string().min(10, "رقم الموبايل غير صحيح").regex(/^09\d{8}$/, "رقم الموبايل يجب أن يبدأ بـ 09 ويكون 10 أرقام"),
    landline: z.string().optional().refine((val) => !val || /^0[1-9]\d{7,8}$/.test(val), "رقم الهاتف الثابت غير صحيح"),
    email: z.string().email("البريد الإلكتروني غير صحيح").optional(),
});

// Schema لبيانات الصيدلية
const pharmacySchema = z.object({
    pharmacyName: z.string().min(2, "اسم الصيدلية مطلوب").max(50, "اسم الصيدلية طويل جداً"),
    pharmacyLocation: z.string().min(2, "المنطقة مطلوبة").max(50, "المنطقة طويلة جداً"),
    pharmacyLocationDetails: z.string().max(500, "تفاصيل الموقع طويلة جداً").optional(),
    licenseImage: z.string().optional(),
});

// Schema للأمان
const securitySchema = z.object({
    password: z.string().optional(),
    passwordConfirm: z.string().optional(),
}).refine((data) => !data.password || data.password === data.passwordConfirm, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["passwordConfirm"],
}).refine((data) => !data.password || data.password.length >= 8, {
    message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    path: ["password"],
});

export default function ProfilePage() {
    const { user, updateProfile } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'info' | 'pharmacy' | 'security'>('info');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
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

    // التحقق الفوري عند تغيير الحقول
    useEffect(() => {
        validateCurrentTab();
    }, [form, tab]);

    const validateCurrentTab = () => {
        let schema: any;
        const tabData: any = {};

        switch (tab) {
            case 'info':
                schema = infoSchema;
                tabData.firstName = form.firstName;
                tabData.lastName = form.lastName;
                tabData.phone = form.phone;
                tabData.landline = form.landline;
                tabData.email = form.email;
                break;
            case 'pharmacy':
                schema = pharmacySchema;
                tabData.pharmacyName = form.pharmacyName;
                tabData.pharmacyLocation = form.pharmacyLocation;
                tabData.pharmacyLocationDetails = form.pharmacyLocationDetails;
                tabData.licenseImage = form.licenseImage;
                break;
            case 'security':
                schema = securitySchema;
                tabData.password = form.password;
                tabData.passwordConfirm = form.passwordConfirm;
                break;
        }

        try {
            schema.parse(tabData);
            setErrors({});
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string[]> = {};
                error.issues.forEach((err) => {
                    const path = err.path[0] as string;
                    if (!fieldErrors[path]) fieldErrors[path] = [];
                    fieldErrors[path].push(err.message);
                });
                setErrors(fieldErrors);
            }
        }
    };

    const getFieldError = (field: string) => errors[field]?.[0];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            toast.error('حجم الملف يجب أن لا يتجاوز 5 ميغابايت');
            return;
        }
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            toast.error('يرجى رفع صورة أو PDF فقط');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
            setForm(prev => ({ 
                ...prev, 
                licenseImage: reader.result as string, 
                licenseFileName: file.name 
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        validateCurrentTab();
        
        if (Object.keys(errors).length > 0) {
            toast.error('يرجى تصحيح الأخطاء الموجودة');
            return;
        }

        setLoading(true);
        try {
            const { licenseFileName, passwordConfirm, ...payload } = form;
            if (!payload.password) delete (payload as any).password;
            if (!payload.licenseImage && user?.licenseImage) delete (payload as any).licenseImage;
            
            await updateProfile(payload);
            toast.success('تم تحديث البيانات بنجاح');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'خطأ في التحديث');
        }
        setLoading(false);
    };

    const TABS = [
        { id: 'info', label: 'بياناتي', Icon: IconUser_PharmProfile },
        { id: 'pharmacy', label: 'الصيدلية', Icon: IconPharmacy_PharmProfile },
        { id: 'security', label: 'الأمان', Icon: IconLock_PharmProfile },
    ];

    return (
        <>
            {/* ── Header ── */}
            <div className="page-header">
                <h1 className="page-title">الملف الشخصي</h1>
            </div>

            {/* ── Profile card ── */}
            <div className="profile-header" style={{ marginBottom: 20 }}>
                <div className="profile-av">{user?.firstName?.charAt(0) + '' + user?.lastName?.charAt(0)}</div>
                <div>
                    <div className="profile-name">{user?.firstName} {user?.lastName}</div>
                    <div className="profile-pharmacy" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
                        </svg>
                        {user?.pharmacyName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconPhone_PharmProfile /> {user?.phone}
                        {user?.landline && (
                            <>
                                <span style={{ margin: '0 4px' }}>•</span>
                                <IconPhone_PharmProfile /> {user.landline}
                            </>
                        )}
                    </div>
                    {user?.pharmacyLocation && (
                        <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IconPin_PharmProfile /> {user.pharmacyLocation}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{ 
                display: 'flex', gap: 4, background: 'var(--bdr2)', 
                borderRadius: 'var(--r2)', padding: 4, marginBottom: 20 
            }}>
                {TABS.map(({ id, label, Icon }) => (
                    <button 
                        key={id}
                        style={{ 
                            flex: 1, padding: '10px 6px', borderRadius: 10, fontSize: 13, 
                            fontWeight: 700, border: 'none', cursor: 'pointer', 
                            transition: 'all .2s', 
                            background: tab === id ? 'white' : 'transparent', 
                            color: tab === id ? 'var(--p)' : 'var(--tx2)', 
                            boxShadow: tab === id ? 'var(--sh0)' : 'none', 
                            display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', gap: 5 
                        }}
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
                                <input 
                                    className={`input-field ${getFieldError('firstName') ? 'error' : ''}`}
                                    value={form.firstName} 
                                    onChange={e => setForm({ ...form, firstName: e.target.value })} 
                                />
                                {getFieldError('firstName') && (
                                    <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                                        {getFieldError('firstName')}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="input-label">الاسم الأخير</label>
                                <input 
                                    className={`input-field ${getFieldError('lastName') ? 'error' : ''}`}
                                    value={form.lastName} 
                                    onChange={e => setForm({ ...form, lastName: e.target.value })} 
                                />
                                {getFieldError('lastName') && (
                                    <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                                        {getFieldError('lastName')}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="input-row" style={{ marginBottom: 14 }}>
                            <div>
                                <label className="input-label">رقم الموبايل</label>
                                <input 
                                    className={`input-field ${getFieldError('phone') ? 'error' : ''}`}
                                    value={form.phone} 
                                    onChange={e => setForm({ ...form, phone: e.target.value })} 
                                />
                                {getFieldError('phone') && (
                                    <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                                        {getFieldError('phone')}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="input-label">هاتف ثابت</label>
                                <input 
                                    className={`input-field ${getFieldError('landline') ? 'error' : ''}`}
                                    placeholder="011-xxxxxxx" 
                                    value={form.landline} 
                                    onChange={e => setForm({ ...form, landline: e.target.value })} 
                                />
                                {getFieldError('landline') && (
                                    <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                                        {getFieldError('landline')}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="input-wrap">
                            <label className="input-label">البريد الإلكتروني</label>
                            <input 
                                className={`input-field ${getFieldError('email') ? 'error' : ''}`}
                                type="email" 
                                value={form.email} 
                                onChange={e => setForm({ ...form, email: e.target.value })} 
                            />
                            {getFieldError('email') && (
                                <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                                    {getFieldError('email')}
                                </div>
                            )}
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
                                <input 
                                    className={`input-field ${getFieldError('pharmacyName') ? 'error' : ''}`}
                                    value={form.pharmacyName} 
                                    onChange={e => setForm({ ...form, pharmacyName: e.target.value })} 
                                />
                                {getFieldError('pharmacyName') && (
                                    <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                                        {getFieldError('pharmacyName')}
                                    </div>
                                )}
                            </div>
                            <div className="input-wrap">
                                <label className="input-label">المنطقة</label>
                                <input 
                                    className={`input-field ${getFieldError('pharmacyLocation') ? 'error' : ''}`}
                                    placeholder="دمشق - المزة" 
                                    value={form.pharmacyLocation} 
                                    onChange={e => setForm({ ...form, pharmacyLocation: e.target.value })} 
                                />
                                {getFieldError('pharmacyLocation') && (
                                    <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                                        {getFieldError('pharmacyLocation')}
                                    </div>
                                )}
                            </div>
                            <div className="input-wrap" style={{ marginBottom: 0 }}>
                                <label className="input-label">تفاصيل الموقع</label>
                                <textarea 
                                    className={`input-field ${getFieldError('pharmacyLocationDetails') ? 'error' : ''}`}
                                    rows={3} 
                                    placeholder="مقابل... شارع... بناء..." 
                                    value={form.pharmacyLocationDetails}
                                    onChange={e => setForm({ ...form, pharmacyLocationDetails: e.target.value })}
                                    style={{ resize: 'vertical', minHeight: 80 }} 
                                />
                                {getFieldError('pharmacyLocationDetails') && (
                                    <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                                        {getFieldError('pharmacyLocationDetails')}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card" style={{ marginBottom: 16 }}>
                            <div className="card-title" style={{ marginBottom: 14 }}>شهادة مزاولة المهنة</div>
                            <input 
                                ref={fileRef} 
                                type="file" 
                                accept="image/*,.pdf" 
                                style={{ display: 'none' }} 
                                onChange={handleFileChange} 
                            />
                            {!form.licenseImage ? (
                                <button 
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    style={{ 
                                        width: '100%', padding: '24px 16px', 
                                        border: '2px dashed var(--bdr)', 
                                        borderRadius: 'var(--r2)', 
                                        background: 'var(--s2)', cursor: 'pointer', 
                                        textAlign: 'center' 
                                    }}
                                    onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--p)')}
                                    onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--bdr)')}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: 'var(--tx3)' }}>
                                        <IconUpload_PharmProfile />
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx2)' }}>
                                        اضغط لرفع الشهادة
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>
                                        صورة أو PDF — حد أقصى 5MB
                                    </div>
                                </button>
                            ) : (
                                <div style={{ border: '2px solid var(--p)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                                    {form.licenseImage.startsWith('data:image') ? (
                                        <img 
                                            src={form.licenseImage} 
                                            alt="شهادة" 
                                            style={{ 
                                                width: '100%', maxHeight: 260, 
                                                objectFit: 'contain', 
                                                background: '#f8f8f8', display: 'block' 
                                            }} 
                                        />
                                    ) : (
                                        <div style={{ padding: 20, background: 'var(--pf)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ color: 'var(--pd)' }}>
                                                <IconFile_PharmProfile />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--pd)', fontSize: 13 }}>
                                                    {form.licenseFileName}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--tx2)' }}>ملف PDF</div>
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ 
                                        padding: '10px 14px', background: 'var(--pf)', 
                                        display: 'flex', justifyContent: 'space-between', 
                                        alignItems: 'center' 
                                    }}>
                                        <button 
                                            type="button"
                                            style={{ 
                                                background: '#fee2e2', color: 'var(--red)', 
                                                border: 'none', borderRadius: 8, 
                                                padding: '6px 12px', cursor: 'pointer', 
                                                fontSize: 13, fontWeight: 600 
                                            }}
                                            onClick={() => { 
                                                setForm(p => ({ ...p, licenseImage: '', licenseFileName: '' })); 
                                                if (fileRef.current) fileRef.current.value = ''; 
                                            }}
                                        >
                                            حذف
                                        </button>
                                        <button 
                                            type="button"
                                            style={{ 
                                                background: 'var(--pl)', color: 'var(--pd)', 
                                                border: 'none', borderRadius: 8, 
                                                padding: '6px 12px', cursor: 'pointer', 
                                                fontSize: 13, fontWeight: 600 
                                            }}
                                            onClick={() => fileRef.current?.click()}
                                        >
                                            تغيير
                                        </button>
                                        <span style={{ fontSize: 12, color: 'var(--pd)', fontWeight: 600 }}>
                                            تم الرفع
                                        </span>
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
                        <div style={{ 
                            background: '#fffbeb', border: '1px solid #fde68a', 
                            borderRadius: 'var(--r1)', padding: '10px 14px', 
                            marginBottom: 16, fontSize: 13, color: '#92400e' 
                        }}>
                            اتركها فارغة إذا لم تريد التغيير
                        </div>
                        <div className="input-wrap">
                            <label className="input-label">كلمة المرور الجديدة</label>
                            <input 
                                className={`input-field ${getFieldError('password') ? 'error' : ''}`}
                                type="password" 
                                placeholder="8 أحرف على الأقل" 
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })} 
                            />
                            {getFieldError('password') && (
                                <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                                    {getFieldError('password')}
                                </div>
                            )}
                        </div>
                        <div className="input-wrap" style={{ marginBottom: 0 }}>
                            <label className="input-label">تأكيد كلمة المرور</label>
                            <input 
                                className={`input-field ${getFieldError('passwordConfirm') ? 'error' : ''}`}
                                type="password" 
                                placeholder="أعد كتابة كلمة المرور"
                                value={form.passwordConfirm}
                                onChange={e => setForm({ ...form, passwordConfirm: e.target.value })}
                                style={{ 
                                    borderColor: getFieldError('passwordConfirm') ? 'var(--red)' : '' 
                                }} 
                            />
                            {getFieldError('passwordConfirm') && (
                                <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                                    {getFieldError('passwordConfirm')}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className='flex justify-center'>
                    <button
                        className="btn-primary"
                        type="submit"
                        disabled={loading || Object.keys(errors).length > 0}
                        style={{ margin: '0 auto' }}
                    >
                        {loading ? (
                            <>
                                <div
                                    style={{
                                        width: 16,
                                        height: 16,
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white',
                                        borderRadius: '50%',
                                        animation: 'spin .7s linear infinite'
                                    }}
                                />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <IconSave_PharmProfile />
                                حفظ التغييرات
                            </>
                        )}
                    </button>
                </div>
            </form>
        </>
    );
}
