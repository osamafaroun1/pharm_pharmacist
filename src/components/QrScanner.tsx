import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { IconBarcode, IconX } from './Icons';

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

// جميع أنواع الباركود المدعومة
const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

export default function QrScanner({ onScan, onClose }: Props) {
  const scannerRef   = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const [error,   setError]   = useState('');
  const [started, setStarted] = useState(false);
  const divId = useRef(`qr-reader-${Date.now()}`).current;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    let cancelled = false;

    const scanner = new Html5Qrcode(divId, {
      formatsToSupport: FORMATS,
      verbose: false,
    });
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        // نحاول الكاميرا الخلفية أولاً
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (w, h) => {
              // مستطيل أفقي مناسب للباركودات الخطية
              const size = Math.min(w, h) * 0.7;
              return { width: Math.min(size * 1.6, w * 0.85), height: size * 0.5 };
            },
            aspectRatio: 1.7,
            disableFlip: false,
          },
          (decodedText) => {
            if (cancelled) return;
            // تنظيف النص المقروء
            const clean = decodedText.trim();
            isRunningRef.current = false;
            scanner.stop().catch(() => {}).finally(() => {
              if (!cancelled) onScan(clean);
            });
          },
          () => {} // ignore per-frame errors
        );

        if (!cancelled) {
          isRunningRef.current = true;
          setStarted(true);
        }
      } catch (err: any) {
        if (cancelled) return;
        isRunningRef.current = false;
        const msg = typeof err === 'string' ? err : err?.message || '';
        if (msg.toLowerCase().includes('notallowed') || msg.toLowerCase().includes('permission')) {
          setError('لم يتم السماح بالوصول للكاميرا.\nيرجى السماح من إعدادات المتصفح.');
        } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('no camera')) {
          setError('لا توجد كاميرا متاحة على هذا الجهاز.');
        } else {
          setError('تعذر تشغيل الكاميرا.\nتأكد من أن الكاميرا غير مستخدمة في تطبيق آخر.');
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      document.body.style.overflow = '';
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
        {/* Header */}
        <div className="qr-header">
          <button className="qr-close" onClick={handleClose}><IconX size={16} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconBarcode size={18} />
            <span className="qr-title">مسح باركود الدواء</span>
          </div>
        </div>

        {/* Camera */}
        <div className="qr-body">
          {error ? (
            <div className="qr-error">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--tx3)' }}>
                <IconBarcode size={44} />
              </div>
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

        {/* Hint */}
        {!error && (
          <div className="qr-hint">
            وجّه الكاميرا نحو باركود الدواء — يدعم EAN-13 وجميع الأنواع
          </div>
        )}
      </div>
    </div>
  );
}