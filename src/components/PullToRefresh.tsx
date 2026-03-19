import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const THRESHOLD = 70; // px للسحب قبل التفعيل

export default function PullToRefresh({ onRefresh, children }: Props) {
  const [pullY,      setPullY]      = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [released,   setReleased]   = useState(false);
  const startY    = useRef(0);
  const pulling   = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const canPull = () => {
    const el = contentRef.current;
    return el ? el.scrollTop === 0 : true;
  };

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (!canPull()) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      // منع الـ scroll الافتراضي فقط عند السحب للأسفل من الأعلى
      if (canPull()) {
        e.preventDefault();
        setPullY(Math.min(delta * 0.5, THRESHOLD + 20));
      }
    } else {
      pulling.current = false;
      setPullY(0);
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullY >= THRESHOLD) {
      setReleased(true);
      setRefreshing(true);
      setPullY(THRESHOLD);
      try { await onRefresh(); } catch {}
      setRefreshing(false);
      setReleased(false);
      setPullY(0);
    } else {
      setPullY(0);
    }
  }, [pullY, onRefresh]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const ready    = pullY >= THRESHOLD;

  return (
    <div
      ref={contentRef}
      style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', WebkitOverflowScrolling: 'touch' }}
    >
      {/* مؤشر السحب */}
      <div style={{
        height: pullY > 0 || refreshing ? `${refreshing ? THRESHOLD : pullY}px` : 0,
        transition: released ? 'height .2s ease' : 'none',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--pf)',
      }}>
        {pullY > 0 || refreshing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {refreshing ? (
              <div style={{
                width: 28, height: 28,
                border: '3px solid var(--pl)',
                borderTopColor: 'var(--p)',
                borderRadius: '50%',
                animation: 'spin .7s linear infinite',
              }} />
            ) : (
              <div style={{
                width: 28, height: 28,
                border: '3px solid var(--p)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: `rotate(${progress * 180}deg)`,
                transition: 'transform .1s',
                fontSize: 16,
                color: 'var(--p)',
              }}>
                {ready ? '✓' : '↓'}
              </div>
            )}
            <span style={{ fontSize: 12, color: 'var(--p)', fontWeight: 600 }}>
              {refreshing ? 'جاري التحديث...' : ready ? 'أفلت للتحديث' : 'اسحب للتحديث'}
            </span>
          </div>
        ) : null}
      </div>

      {children}
    </div>
  );
}