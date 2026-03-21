// LoginForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import { z } from 'zod';

// Form Schema
const loginSchema = z.object({
    identity: z
        .string()
        .min(1, 'رقم الهاتف مطلوب')
        .trim()
        .regex(/^09\d{8}$/, 'رقم الموبايل يجب أن يبدأ بـ 09 ويكون 10 أرقام'),

    password: z
        .string()
        .min(1, 'كلمة المرور مطلوبة')
        .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

type LoginErrors = {
    identity?: string;
    password?: string;
};

export function LoginForm() {
    const [loginForm, setLoginForm] = useState({ identity: '', password: '' });
    const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
    const [loading, setLoading] = useState(false);
    const { login } = useAuthStore();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoginErrors({});

        try {
            loginSchema.parse(loginForm); 
        } catch (err) {
            if (err instanceof z.ZodError) {
                const errors: LoginErrors = {};
                err.issues.forEach(issue => {
                    const path = issue.path[0];
                    if (path === 'identity') {
                        errors.identity = issue.message;
                    } else if (path === 'password') {
                        errors.password = issue.message;
                    }
                });
                setLoginErrors(errors);
                toast.error('يرجى تصحيح أخطاء الحقول');
                return;
            }
        }

        setLoading(true);
        try {
            await login(loginForm.identity, loginForm.password);
            toast.success('مرحباً بك في النظام!');
            navigate('/');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'خطأ في تسجيل الدخول';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ marginTop: 24 }}>
            {/* LOGIN FORM */}
            <form onSubmit={handleLogin}>
                <div className="input-wrap">
                    <label className="input-label">رقم الهاتف*</label>
                    <input
                        className="input-field"
                        placeholder="09xxxxxxxx"
                        value={loginForm.identity}
                        onChange={e => setLoginForm({ ...loginForm, identity: e.target.value })}
                    />
                    {loginErrors.identity && <p className="error-text">{loginErrors.identity}</p>}
                </div>
                <div className="input-wrap" style={{ marginBottom: 24 }}>
                    <label className="input-label">كلمة المرور *</label>
                    <input
                        className="input-field"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                    {loginErrors.password && <p className="error-text">{loginErrors.password}</p>}
                </div>

                <button className="btn-primary" type="submit" disabled={loading}>
                    {loading ? 'جاري الدخول...' : 'دخول إلى النظام →'}
                </button>
            </form>
        </div>
    );
}
