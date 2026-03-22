import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useCartStore } from '../store/cartStore';
import { IconPill, IconCart, IconSearch, IconX } from './Icons';

interface Props {
  barcode: string;
  onClose: () => void;
}

export default function QrResultModal({ barcode, onClose }: Props) {
  const { addItem }    = useCartStore();
  const [product,   setProduct]   = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [imgModal,  setImgModal]  = useState(false);

  useEffect(() => { fetchProduct(); }, [barcode]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products/barcode/${encodeURIComponent(barcode.trim())}`);
      setProduct(data);
    } catch (err: any) {
      setNotFound(true);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    if (!product) return;
    addItem({
      productId:     product.id,
      name:          product.name,
      price:         product.price,
      quantity:      1,
      warehouseId:   product.warehouseId,
      warehouseName: product.warehouse?.name || '',
    });
    toast.success(`تمت إضافة ${product.name} إلى السلة`);
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
              <div style={{ fontSize: 14, color: 'var(--tx2)' }}>جاري البحث...</div>
              <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 4, fontFamily: 'monospace' }}>{barcode}</div>
            </div>
          ) : notFound ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--tx3)' }}>
                <IconSearch size={48} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>المنتج غير موجود</div>
              <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 12 }}>
                لم يتم العثور على منتج بهذا الباركود
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx3)', background: 'var(--s2)', padding: '8px 14px', borderRadius: 'var(--r1)', marginBottom: 24, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {barcode}
              </div>
              <button className="btn-ghost" style={{ width: '100%', padding: 12 }} onClick={onClose}>إغلاق</button>
            </div>
          ) : (
            <>
              <div className="modal-header">
                <button className="modal-close" onClick={onClose}><IconX size={14} /></button>
                <div>
                  <div className="modal-title">نتيجة المسح</div>
                  <div style={{ fontSize: 11, color: 'var(--tx3)', fontFamily: 'monospace' }}>{barcode}</div>
                </div>
              </div>

              {/* Product */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                <div
                  style={{ width: 88, height: 88, borderRadius: 'var(--r2)', overflow: 'hidden', background: 'var(--pf)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--bdr2)', cursor: product.imageUrl ? 'zoom-in' : 'default', color: 'var(--p)' }}
                  onClick={() => product.imageUrl && setImgModal(true)}
                >
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <IconPill size={36} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.3, marginBottom: 4 }}>{product.name}</div>
                  {product.scientificName && <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 2 }}>{product.scientificName}</div>}
                  {product.company && <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 8 }}>{product.company}</div>}
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--p)' }}>{fmt(product.price)}</div>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'الوحدة',   value: product.unit || 'علبة' },
                  { label: 'المستودع', value: product.warehouse?.name || '—' },
                  { label: 'التصنيف',  value: product.category?.name  || '—' },
                  { label: 'الشركة',   value: product.company || '—' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'var(--s2)', borderRadius: 'var(--r1)', padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {product.description && (
                <div style={{ background: 'var(--s2)', borderRadius: 'var(--r1)', padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6 }}>
                  {product.description}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost" style={{ flex: 1, padding: 12 }} onClick={onClose}>إغلاق</button>
                <button onClick={handleAdd}
                  style={{ flex: 2, padding: 12, background: 'var(--p)', color: 'white', border: 'none', borderRadius: 'var(--r2)', fontFamily: 'Cairo', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <IconCart size={15} /> إضافة إلى السلة
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {imgModal && product?.imageUrl && (
        <div onClick={() => setImgModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={product.imageUrl} alt={product.name}
            style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: 'var(--r3)', objectFit: 'contain' }} />
        </div>
      )}
    </>
  );
}