import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: Props) {
  const scannerRef   = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);   // ← نتتبع هل الكاميرا شغّالة فعلاً
  const [error,   setError]   = useState('');
  const [started, setStarted] = useState(false);
  const divId = useRef(`qr-reader-${Date.now()}`).current;

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    let cancelled = false;

    const scanner = new Html5Qrcode(divId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 140 } },
      (decodedText) => {
        if (cancelled) return;
        isRunningRef.current = false;
        scanner.stop()
          .catch(() => {})
          .finally(() => { if (!cancelled) onScan(decodedText); });
      },
      () => {}   // ignore per-frame errors
    )
    .then(() => {
      if (!cancelled) {
        isRunningRef.current = true;
        setStarted(true);
      }
    })
    .catch(err => {
      if (cancelled) return;
      isRunningRef.current = false;
      const msg = typeof err === 'string' ? err : err?.message || '';
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
        setError('لم يتم السماح بالوصول للكاميرا.\nيرجى السماح من إعدادات المتصفح.');
      } else {
        setError('تعذر تشغيل الكاميرا.\nتأكد من أن الكاميرا غير مستخدمة في تطبيق آخر.');
      }
    });

    return () => {
      cancelled = true;
      document.body.style.overflow = '';
      // فقط نوقف إذا كانت شغّالة فعلاً
      if (isRunningRef.current && scannerRef.current) {
        isRunningRef.current = false;
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleClose = () => {
    if (isRunningRef.current && scannerRef.current) {
      isRunningRef.current = false;
      scannerRef.current.stop().catch(() => {}).finally(() => onClose());
    } else {
      onClose();
    }
  };

  return (
    <div className="qr-overlay" onClick={handleClose}>
      <div className="qr-modal" onClick={e => e.stopPropagation()}>

        <div className="qr-header">
          <button className="qr-close" onClick={handleClose}>✕</button>
          <div className="qr-title">مسح باركود الدواء</div>
        </div>

        <div className="qr-body">
          {error ? (
            <div className="qr-error">
              <div style={{ fontSize: 44, marginBottom: 12 }}>📷</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>لا يمكن فتح الكاميرا</div>
              <div style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{error}</div>
              <button onClick={handleClose}
                style={{ marginTop: 20, background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 'var(--r1)', padding: '10px 28px', fontFamily: 'Cairo', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                إغلاق
              </button>
            </div>
          ) : (
            <>
              <div id={divId} className="qr-reader" />
              {!started && (
                <div className="qr-loading">
                  <div className="spinner" />
                  <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    جاري تشغيل الكاميرا...
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!error && (
          <div className="qr-hint">📦 وجّه الكاميرا نحو باركود الدواء</div>
        )}
      </div>
    </div>
  );
}