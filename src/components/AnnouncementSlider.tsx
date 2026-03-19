import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

interface Announcement {
  id: number; title: string; subtitle: string | null;
  description: string | null; image: string | null;
  bgColor: string; badgeText: string | null; badgeColor: string | null;
}

export default function AnnouncementSlider() {
  const [items,   setItems]   = useState<Announcement[]>([]);
  const [current, setCurrent] = useState(0);
  const [expanded, setExpanded] = useState<Announcement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get('/announcements?active=true')
      .then(r => setItems(r.data))
      .catch(() => {});
  }, []);

  const next = useCallback(() => setCurrent(c => (c + 1) % items.length), [items.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + items.length) % items.length), [items.length]);

  // Auto-play
  useEffect(() => {
    if (items.length <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items.length, next]);

  const pause = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const resume = () => {
    if (items.length <= 1) return;
    timerRef.current = setInterval(next, 5000);
  };

  if (items.length === 0) return null;

  const item = items[current];

  return (
    <>
      <div
        className="slider-wrap"
        onMouseEnter={pause} onMouseLeave={resume}
        onTouchStart={pause} onTouchEnd={resume}
      >
        {/* Slide */}
        <div
          className="slide"
          style={{
            background: item.bgColor,
            ...(item.image ? { backgroundImage: `url(${item.image})` } : {}),
          }}
          onClick={() => setExpanded(item)}
        >
          {/* Badge */}
          {item.badgeText && (
            <span className="slide-badge" style={{ background: item.badgeColor || '#f59e0b' }}>
              {item.badgeText}
            </span>
          )}

          <div className="slide-content">
            {/* Text */}
            <div className="slide-text">
              <div className="slide-title">{item.title}</div>
              {item.subtitle && <div className="slide-subtitle">{item.subtitle}</div>}
              {item.description && (
                <div className="slide-desc">{item.description}</div>
              )}
              <button className="slide-more">اقرأ المزيد ←</button>
            </div>

            {/* Image */}
            {item.image && (
              <div className="slide-img-wrap">
                <img src={item.image} alt={item.title} className="slide-img" />
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="slide-progress">
            <div className="slide-progress-bar" key={`${current}-${item.id}`} />
          </div>
        </div>

        {/* Arrows */}
        {items.length > 1 && (
          <>
            <button className="slide-arrow slide-arrow-prev" onClick={e => { e.stopPropagation(); prev(); }}>‹</button>
            <button className="slide-arrow slide-arrow-next" onClick={e => { e.stopPropagation(); next(); }}>›</button>
          </>
        )}

        {/* Dots */}
        {items.length > 1 && (
          <div className="slide-dots">
            {items.map((_, i) => (
              <button key={i} className={`slide-dot${i === current ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setCurrent(i); }} />
            ))}
          </div>
        )}
      </div>

      {/* Expanded Modal */}
      {expanded && (
        <div className="modal-overlay" onClick={() => setExpanded(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ background: expanded.bgColor, borderRadius: 'var(--r3) var(--r3) 0 0', padding: '20px 20px 16px', margin: '-28px -28px 20px' }}>
              {expanded.badgeText && (
                <span style={{ background: expanded.badgeColor || '#f59e0b', color: 'white', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, display: 'inline-block', marginBottom: 10 }}>
                  {expanded.badgeText}
                </span>
              )}
              <div style={{ color: 'white', fontWeight: 900, fontSize: 20, lineHeight: 1.3 }}>{expanded.title}</div>
              {expanded.subtitle && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 6 }}>{expanded.subtitle}</div>}
            </div>

            {expanded.image && (
              <img src={expanded.image} alt={expanded.title} style={{ width: '100%', borderRadius: 'var(--r2)', marginBottom: 16, maxHeight: 200, objectFit: 'cover' }} />
            )}

            {expanded.description && (
              <p style={{ fontSize: 15, color: 'var(--tx)', lineHeight: 1.8, marginBottom: 20 }}>{expanded.description}</p>
            )}

            <button
              onClick={() => setExpanded(null)}
              style={{ width: '100%', padding: 12, background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 'var(--r2)', fontFamily: 'Cairo', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
}