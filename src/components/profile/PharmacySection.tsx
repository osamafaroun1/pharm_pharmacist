import React from 'react';
import { IconUpload_PharmProfile, IconFile_PharmProfile } from '../Icons';

interface Props {
    form: any;
    setForm: any;
    getFieldError: (field: string) => string | undefined;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PharmacySection({ form, setForm, getFieldError, handleFileChange }: Props) {
    const fileRef = React.useRef<HTMLInputElement>(null);

    return (
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
                    {getFieldError('pharmacyName') && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{getFieldError('pharmacyName')}</div>}
                </div>
                <div className="input-wrap">
                    <label className="input-label">المنطقة</label>
                    <input
                        className={`input-field ${getFieldError('pharmacyLocation') ? 'error' : ''}`}
                        placeholder="دمشق - المزة"
                        value={form.pharmacyLocation}
                        onChange={e => setForm({ ...form, pharmacyLocation: e.target.value })}
                    />
                    {getFieldError('pharmacyLocation') && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{getFieldError('pharmacyLocation')}</div>}
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
                    {getFieldError('pharmacyLocationDetails') && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{getFieldError('pharmacyLocationDetails')}</div>}
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
    );
}