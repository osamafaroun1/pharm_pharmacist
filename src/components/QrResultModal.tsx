import { IconPill, IconSearch, IconCart } from '../components/Icons';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useCartStore } from '../store/cartStore';

interface Props {
  barcode: string;
  onClose: () => void;
}

export default function QrResultModal({ barcode, onClose }: Props) {
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgModal, setImgModal] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [barcode]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products/barcode/${encodeURIComponent(barcode.trim())}`);
      setProduct(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setNotFound(true);
      }
    }
    setLoading(false);
  };

  const handleAdd = () => {
    if (!product) return;
    if (product.stock <= 0) { toast.error('المنتج غير متوفر في المخزون'); return; }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      warehouseId: product.warehouseId,
      warehouseName: product.warehouse?.name || '',
    });
    toast.success(`✅ تمت إضافة ${product.name} إلى السلة`);
    onClose();
  };

  const fmt = (n: number) => new Intl.NumberFormat('ar-SY').format(n) + ' ل.س';

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>

          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 14px' }} />
              <div style={{ fontSize: 14, color: 'var(--tx2)' }}>جاري البحث عن المنتج...</div>
              <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 6 }}>الباركود: {barcode}</div>
            </div>
          ) : notFound ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>المنتج غير موجود</div>
              <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 6 }}>
                لم يتم العثور على منتج بهذا الباركود
              </div>
              <div style={{ fontSize: 12, color: 'var(--tx3)', background: 'var(--s2)', padding: '8px 14px', borderRadius: 'var(--r1)', marginBottom: 24, wordBreak: 'break-all' }}>
                {barcode}
              </div>
              <button className="btn-ghost" style={{ width: '100%', padding: 12 }} onClick={onClose}>إغلاق</button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="modal-header">
                <button className="modal-close" onClick={onClose}>✕</button>
                <div style={{ textAlign: 'right' }}>
                  <div className="modal-title">نتيجة المسح</div>
                  <div style={{ fontSize: 12, color: 'var(--tx3)' }}>الباركود: {barcode}</div>
                </div>
              </div>

              {/* Product card */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                {/* صورة */}
                <div
                  style={{ width: 90, height: 90, borderRadius: 'var(--r2)', overflow: 'hidden', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0, border: '1px solid var(--bdr2)', cursor: product.imageUrl ? 'zoom-in' : 'default' }}
                  onClick={() => product.imageUrl && setImgModal(true)}
                >
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '💊'
                  }
                </div>

                {/* معلومات */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4, lineHeight: 1.3 }}>{product.name}</div>
                  {product.scientificName && <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 2 }}>{product.scientificName}</div>}
                  {product.company       && <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 8 }}>{product.company}</div>}
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--p)' }}>{fmt(product.price)}</div>
                </div>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'الوحدة',      value: product.unit || 'علبة' },
                  { label: 'المخزون',     value: product.stock > 0 ? `${product.stock} وحدة` : 'نفد المخزون', color: product.stock > 0 ? 'var(--p)' : 'var(--red)' },
                  { label: 'المستودع',    value: product.warehouse?.name || '—' },
                  { label: 'التصنيف',     value: product.category?.name  || '—' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'var(--s2)', borderRadius: 'var(--r1)', padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: (item as any).color || 'var(--tx)' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {product.description && (
                <div style={{ background: 'var(--s2)', borderRadius: 'var(--r1)', padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6 }}>
                  {product.description}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost" style={{ flex: 1, padding: 12, fontSize: 14 }} onClick={onClose}>إغلاق</button>
                <button
                  onClick={handleAdd}
                  disabled={product.stock <= 0}
                  style={{ flex: 2, padding: 12, background: product.stock > 0 ? 'var(--p)' : 'var(--bdr)', color: product.stock > 0 ? 'white' : 'var(--tx3)', border: 'none', borderRadius: 'var(--r2)', fontFamily: 'Cairo', fontWeight: 700, fontSize: 14, cursor: product.stock > 0 ? 'pointer' : 'not-allowed' }}
                >
                  {product.stock > 0 ? '+ إضافة إلى السلة' : 'نفد المخزون'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image zoom modal */}
      {imgModal && product?.imageUrl && (
        <div
          onClick={() => setImgModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <img src={product.imageUrl} alt={product.name}
            style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: 'var(--r3)', objectFit: 'contain' }} />
        </div>
      )}
    </>
  );
}