import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { IconLock_PharmProfile, IconPharmacy_PharmProfile, IconSave_PharmProfile, IconUser_PharmProfile } from '../components/Icons';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import PersonalInfoSection from '../components/profile/PersonalInfoSection';
import PharmacySection from '../components/profile/PharmacySection';
import SecuritySection from '../components/profile/SecuritySection';

// ====================== Schemas ======================
const infoSchema = z.object({
    firstName: z.string().min(2, "الاسم الأول يجب أن يكون 2 أحرف على الأقل").max(50, "الاسم الأول طويل جداً"),
    lastName: z.string().min(2, "الاسم الأخير يجب أن يكون 2 أحرف على الأقل").max(50, "الاسم الأخير طويل جداً"),
    phone: z.string().min(10, "رقم الموبايل غير صحيح").regex(/^09\d{8}$/, "رقم الموبايل يجب أن يبدأ بـ 09 ويكون 10 أرقام"),
    landline: z.string().optional().refine((val) => !val || /^0[1-9]\d{7,8}$/.test(val), "رقم الهاتف الثابت غير صحيح"),
    email: z.string().email("البريد الإلكتروني غير صحيح").optional(),
});

const pharmacySchema = z.object({
    pharmacyName: z.string().min(2, "اسم الصيدلية مطلوب").max(50, "اسم الصيدلية طويل جداً"),
    pharmacyLocation: z.string().min(2, "المنطقة مطلوبة").max(50, "المنطقة طويلة جداً"),
    pharmacyLocationDetails: z.string().max(500, "تفاصيل الموقع طويلة جداً").optional(),
    licenseImage: z.string().optional(),
});

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
            <ProfileHeader user={user} />
            <ProfileTabs tab={tab} setTab={setTab} TABS={TABS} />

            <form onSubmit={handleSave}>
                {tab === 'info' && (
                    <PersonalInfoSection 
                        form={form} 
                        setForm={setForm} 
                        getFieldError={getFieldError} 
                    />
                )}

                {tab === 'pharmacy' && (
                    <PharmacySection 
                        form={form} 
                        setForm={setForm} 
                        getFieldError={getFieldError} 
                        handleFileChange={handleFileChange} 
                    />
                )}

                {tab === 'security' && (
                    <SecuritySection 
                        form={form} 
                        setForm={setForm} 
                        getFieldError={getFieldError} 
                    />
                )}

                <div className='flex justify-center'>
                    <button
                        className="btn-primary"
                        type="submit"
                        disabled={loading || Object.keys(errors).length > 0}
                        style={{ margin: '0 auto' }}
                    >
                        {loading ? (
                            <>جاري الحفظ...</>
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