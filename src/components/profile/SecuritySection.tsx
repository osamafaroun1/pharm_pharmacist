interface Props {
    form: any;
    setForm: any;
    getFieldError: (field: string) => string | undefined;
}

export default function SecuritySection({ form, setForm, getFieldError }: Props) {
    return (
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
                {getFieldError('password') && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{getFieldError('password')}</div>}
            </div>
            <div className="input-wrap" style={{ marginBottom: 0 }}>
                <label className="input-label">تأكيد كلمة المرور</label>
                <input
                    className={`input-field ${getFieldError('passwordConfirm') ? 'error' : ''}`}
                    type="password"
                    placeholder="أعد كتابة كلمة المرور"
                    value={form.passwordConfirm}
                    onChange={e => setForm({ ...form, passwordConfirm: e.target.value })}
                />
                {getFieldError('passwordConfirm') && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{getFieldError('passwordConfirm')}</div>}
            </div>
        </div>
    );
}