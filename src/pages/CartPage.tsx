import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCartStore } from '../store/cartStore';
import api from '../services/api';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, total } = useCartStore();
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat('ar-SY').format(n) + ' ل.س';

  const warehouseGroups = items.reduce((acc: any, item) => {
    if (!acc[item.warehouseId]) acc[item.warehouseId] = { name: item.warehouseName, items: [] };
    acc[item.warehouseId].items.push(item);
    return acc;
  }, {});

  const handleOrder = async () => {
    if (items.length === 0) { toast.error('السلة فارغة'); return; }
    setLoading(true);
    try {
      for (const wId of Object.keys(warehouseGroups)) {
        const g = warehouseGroups[wId];
        await api.post('/orders', {
          warehouseId: parseInt(wId),
          items: g.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })),
          notes,
        });
      }
      clearCart();
      toast.success('✅ تم إرسال طلبك بنجاح!');
      navigate('/orders');
    } catch (err: any) { toast.error(err.response?.data?.message || 'خطأ في الإرسال'); }
    setLoading(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">🛒 سلة المشتريات</h1>
          <div className="page-sub">{items.length} منتج في السلة</div>
        </div>
        {items.length > 0 && (
          <button className="btn-danger-soft" onClick={() => clearCart()}>🗑 تفريغ السلة</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <div className="empty-text">السلة فارغة</div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--tx3)', marginBottom: 20 }}>أضف منتجات من الصفحة الرئيسية</div>
          <button className="btn-green" onClick={() => navigate('/')}>تصفح المنتجات</button>
        </div>
      ) : (
        <div className="dash-grid">
          {/* Items */}
          <div>
            {Object.entries(warehouseGroups).map(([wId, group]: any) => (
              <div key={wId} style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--p)', marginBottom: 12 }}>🏭 {group.name}</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {group.items.map((item: any) => (
                    <div key={item.productId} className="card" style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <button className="btn-danger-soft" onClick={() => removeItem(item.productId)}>حذف</button>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.name}</div>
                          <div style={{ color: 'var(--tx2)', fontSize: 13 }}>{fmt(item.price)} / وحدة</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                        <div style={{ fontWeight: 700, color: 'var(--p)', fontSize: 16 }}>{fmt(item.price * item.quantity)}</div>
                        <div className="qty-row">
                          <button className="qty-btn" style={{ color: 'var(--p)' }} onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                          <span className="qty-val">{item.quantity}</span>
                          <button className="qty-btn" style={{ color: 'var(--red)' }} onClick={() => updateQuantity(item.productId, item.quantity - 1)}>−</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 16 }}>ملاحظات الطلب</div>
              <textarea
                className="input-field"
                rows={4}
                placeholder="أي ملاحظات إضافية للأدمن..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div className="cart-total" style={{ marginBottom: 16 }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ opacity: .65, fontSize: 12 }}>الدفع يدوياً مع المندوب</div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{fmt(total())}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ opacity: .65, fontSize: 13 }}>المجموع الكلي</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{items.length} منتج</div>
              </div>
            </div>

            <button className="btn-primary" onClick={handleOrder} disabled={loading}>
              {loading ? 'جاري الإرسال...' : '✅ تأكيد الطلب وإرساله'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}