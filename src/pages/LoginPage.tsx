// LoginPage.tsx
import { useState } from 'react';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';

export default function LoginPage() {
    const [tab, setTab] = useState<'login' | 'register'>('login');

    return (
        <div className="login-bg">
            <div className="login-card">
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ fontSize: 50, marginBottom: 8 }}>💊</div>
                    <div className="login-logo">نظام الموزع الدوائي</div>
                    <div className="login-sub">بوابة الصيدلاني 🇸🇾</div>
                </div>

                <div className="card">
                    <div className="auth-tabs" style={{ marginBottom: 24 }}>
                        <button
                            className={`auth-tab${tab === 'login' ? ' active' : ''}`}
                            onClick={() => setTab('login')}
                        >
                            تسجيل دخول
                        </button>
                        <button
                            className={`auth-tab${tab === 'register' ? ' active' : ''}`}
                            onClick={() => setTab('register')}
                        >
                            حساب جديد
                        </button>
                    </div>

                    {tab === 'login' && <LoginForm />}
                    {tab === 'register' && <RegisterForm />}
                </div>

                <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--tx3)', marginTop: 20 }}>
                    © 2026 نظام الموزع الدوائي – سوريا
                </p>
            </div>
        </div>
    );
}
