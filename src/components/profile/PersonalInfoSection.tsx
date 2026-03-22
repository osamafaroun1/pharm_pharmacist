interface Props {
    form: any;
    setForm: any;
    getFieldError: (field: string) => string | undefined;
}

export default function PersonalInfoSection({ form, setForm, getFieldError }: Props) {
    return (
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
                    {getFieldError('firstName') && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{getFieldError('firstName')}</div>}
                </div>
                <div>
                    <label className="input-label">الاسم الأخير</label>
                    <input
                        className={`input-field ${getFieldError('lastName') ? 'error' : ''}`}
                        value={form.lastName}
                        onChange={e => setForm({ ...form, lastName: e.target.value })}
                    />
                    {getFieldError('lastName') && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{getFieldError('lastName')}</div>}
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
                    {getFieldError('phone') && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{getFieldError('phone')}</div>}
                </div>
                <div>
                    <label className="input-label">هاتف ثابت</label>
                    <input
                        className={`input-field ${getFieldError('landline') ? 'error' : ''}`}
                        placeholder="011-xxxxxxx"
                        value={form.landline}
                        onChange={e => setForm({ ...form, landline: e.target.value })}
                    />
                    {getFieldError('landline') && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{getFieldError('landline')}</div>}
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
                {getFieldError('email') && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{getFieldError('email')}</div>}
            </div>
        </div>
    );
}