// RegisterForm.tsx
import { useState, useRef } from 'react'; // ← useNavigate مُضافة
import { toast } from 'react-toastify';
import { useAuthStore, User } from '../store/authStore';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

interface RegisterPayload extends Omit<User, 'id' | 'role'> {
  password: string;
  licenseImage: string;
  licenseFileName: string;
}

const registerSchema = z.object({
  firstName: z
    .string()
    .min(3, 'الاسم الأول يجب أن يكون 3 أحرف على الأقل')
    .trim(),
  lastName: z
    .string()
    .min(3, 'الاسم الأخير يجب أن يكون 3 أحرف على الأقل')
    .trim(),
  phone: z
    .string()
    .min(10, 'رقم الموبايل يجب أن يكون 10 أرقام')
    .regex(/^09\d{8}$/, 'رقم الموبايل يجب أن يبدأ بـ 09 ويكون 10 أرقام'),
  landline: z.string().optional(),
  email: z
    .string()
    .email('البريد الإلكتروني غير صالح')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم'),
  pharmacyName: z.string().min(3, 'اسم الصيدلية مطلوب'),
  pharmacyLocation: z.string().min(3, 'موقع الصيدلية مطلوب'),
  pharmacyLocationDetails: z.string().optional(),
  licenseImage: z.string().optional().or(z.literal('')),
  licenseFileName: z.string().optional(),
});

type FormErrors = Partial<Record<keyof RegisterPayload, string>>;

export function RegisterForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { register } = useAuthStore();
  const navigate = useNavigate(); 

  const [regForm, setRegForm] = useState<RegisterPayload>({
    firstName: '',
    lastName: '',
    phone: '',
    landline: '',
    email: '',
    password: '',
    pharmacyName: '',
    pharmacyLocation: '',
    pharmacyLocationDetails: '',
    licenseImage: '',
    licenseFileName: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('الحد الأقصى 5 ميغابايت');
      return;
    }
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('صورة أو PDF فقط');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRegForm(prev => ({
        ...prev,
        licenseImage: reader.result as string,
        licenseFileName: file.name,
      }));
      setErrors(prev => ({ ...prev, licenseImage: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      registerSchema.parse(regForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: FormErrors = {};
        err.issues.forEach(issue => {
          const path = issue.path[0] as keyof RegisterPayload;
          fieldErrors[path] = issue.message;
        });
        setErrors(fieldErrors);
        toast.error('يرجى تصحيح الأخطاء في الحقول');
        setLoading(false);
        return;
      }
    }

    try {
      const { licenseFileName, ...payload } = regForm;
      await register(payload);
      toast.success('تم إنشاء الحساب بنجاح!');
      navigate('/'); 
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطأ في إنشاء الحساب';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <form onSubmit={handleRegister}>
        {/* بيانات الصيدلاني */}
        <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--tx2)' }}>👤 بيانات الصيدلاني</div>
          <div className="input-row" style={{ marginBottom: 12 }}>
            <div>
              <label className="input-label">الاسم الأول *</label>
              <input
                className="input-field"
                value={regForm.firstName}
                onChange={e => setRegForm({ ...regForm, firstName: e.target.value })}
              />
              {errors.firstName && <p className="error-text">{errors.firstName}</p>}
            </div>
            <div>
              <label className="input-label">الاسم الأخير *</label>
              <input
                className="input-field"
                value={regForm.lastName}
                onChange={e => setRegForm({ ...regForm, lastName: e.target.value })}
              />
              {errors.lastName && <p className="error-text">{errors.lastName}</p>}
            </div>
          </div>
          <div className="input-row" style={{ marginBottom: 12 }}>
            <div>
              <label className="input-label">رقم موبايل *</label>
              <input
                className="input-field"
                placeholder="09xxxxxxxx"
                value={regForm.phone}
                onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
              />
              {errors.phone && <p className="error-text">{errors.phone}</p>}
            </div>
            <div>
              <label className="input-label">هاتف ثابت</label>
              <input
                className="input-field"
                value={regForm.landline}
                onChange={e => setRegForm({ ...regForm, landline: e.target.value })}
              />
            </div>
          </div>
          <div className="input-wrap">
            <label className="input-label">البريد الإلكتروني</label>
            <input
              type="email"
              className="input-field"
              value={regForm.email}
              onChange={e => setRegForm({ ...regForm, email: e.target.value })}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>
        </div>

        {/* بيانات الصيدلية */}
        <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--tx2)' }}>🏥 بيانات الصيدلية</div>
          <div className="input-wrap">
            <label className="input-label">اسم الصيدلية *</label>
            <input
              className="input-field"
              value={regForm.pharmacyName}
              onChange={e => setRegForm({ ...regForm, pharmacyName: e.target.value })}
            />
            {errors.pharmacyName && <p className="error-text">{errors.pharmacyName}</p>}
          </div>
          <div className="input-wrap">
            <label className="input-label">موقع الصيدلية (المنطقة) *</label>
            <input
              className="input-field"
              value={regForm.pharmacyLocation}
              onChange={e => setRegForm({ ...regForm, pharmacyLocation: e.target.value })}
            />
            {errors.pharmacyLocation && <p className="error-text">{errors.pharmacyLocation}</p>}
          </div>
          <div className="input-wrap">
            <label className="input-label">تفاصيل الموقع</label>
            <textarea
              className="input-field"
              rows={3}
              value={regForm.pharmacyLocationDetails}
              onChange={e => setRegForm({ ...regForm, pharmacyLocationDetails: e.target.value })}
            />
          </div>
        </div>

        {/* شهادة الصيدلية */}
        <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--tx2)' }}>📋 شهادة الصيدلية</div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {!regForm.licenseImage ? (
            <button
              type="button"
              style={{
                width: '100%',
                padding: '20px 16px',
                border: '2px dashed var(--bdr)',
                borderRadius: 'var(--r2)',
                background: 'white',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all .2s',
              }}
              onClick={() => fileRef.current?.click()}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--p)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--bdr)')}
            >
              <div style={{ fontSize: 32, marginBottom: 6 }}>📂</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx2)' }}>اضغط لرفع صورة الشهادة</div>
              <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>صورة أو PDF • حد أقصى 5 ميغابايت</div>
            </button>
          ) : (
            <div
              style={{
                border: '2px solid var(--p)',
                borderRadius: 'var(--r2)',
                padding: 12,
                background: 'var(--pf)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {regForm.licenseImage.startsWith('data:image') ? (
                <img
                  src={regForm.licenseImage}
                  alt="شهادة"
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                />
              ) : (
                <div
                  style={{
                    width: 60,
                    height: 60,
                    background: 'var(--pl)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                  }}
                >
                  📄
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: 'var(--pd)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ✅ {regForm.licenseFileName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>تم رفع الملف بنجاح</div>
              </div>
              <button
                type="button"
                style={{
                  background: '#fee2e2',
                  color: 'var(--red)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
                onClick={() => {
                  setRegForm(p => ({ ...p, licenseImage: '', licenseFileName: '' }));
                  if (fileRef.current) fileRef.current.value = '';
                }}
              >
                حذف
              </button>
            </div>
          )}
          {errors.licenseImage && <p className="error-text">{errors.licenseImage}</p>}
        </div>

        {/* كلمة المرور */}
        <div className="input-wrap" style={{ marginBottom: 24 }}>
          <label className="input-label">كلمة المرور *</label>
          <input
            type="password"
            className="input-field"
            placeholder="8 أحرف على الأقل"
            value={regForm.password}
            onChange={e => setRegForm({ ...regForm, password: e.target.value })}
          />
          {errors.password && <p className="error-text">{errors.password}</p>}
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب →'}
        </button>
      </form>
    </div>
  );
}
