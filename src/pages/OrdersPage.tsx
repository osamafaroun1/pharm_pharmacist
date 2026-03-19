import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { refreshBus } from '../components/Layout';
import { toast } from 'react-toastify';
import { useCartStore } from '../store/cartStore';

const STEPS = [
  { key: 'pending',    label: 'استلام',  icon: '📥' },
  { key: 'confirmed',  label: 'تأكيد',   icon: '✅' },
  { key: 'delivering', label: 'توصيل',   icon: '🚚' },
  { key: 'delivered',  label: 'تسليم',   icon: '🎉' },
];

const statusMap: any = {
  pending:    { label: 'بانتظار التأكيد', cls: 'badge-pending',    icon: '⏳' },
  confirmed:  { label: 'تم التأكيد',      cls: 'badge-confirmed',  icon: '✅' },
  delivering: { label: 'جاري التوصيل',    cls: 'badge-delivering', icon: '🚚' },
  delivered:  { label: 'تم التسليم',      cls: 'badge-delivered',  icon: '🎉' },
  cancelled:  { label: 'ملغي',            cls: 'badge-cancelled',  icon: '❌' },
};

function OrderTracker({ status }: { status: string }) {
  if (status === 'cancelled') return (
    <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--red)', fontWeight: 700, fontSize: 13 }}>❌ تم إلغاء الطلب</div>
  );
  const currentIdx = STEPS.findIndex(s => s.key === status);
  return (
    <div style={{ padding: '12px 0 6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        {/* خط الربط */}
        <div style={{ position: 'absolute', top: 16, right: '12.5%', left: '12.5%', height: 3, background: 'var(--bdr2)', borderRadius: 4, zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 16, right: '12.5%', width: `${(currentIdx / (STEPS.length - 1)) * 75}%`, height: 3, background: 'var(--p)', borderRadius: 4, zIndex: 1, transition: 'width .5s ease' }} />
        {STEPS.map((step, i) => {
          const done    = i <= currentIdx;
          const current = i === currentIdx;
          return (
            <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', zIndex: 2 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: done ? 'var(--p)' : 'var(--bdr2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, border: current ? '3px solid var(--pd)' : '3px solid transparent',
                transition: 'all .3s', boxShadow: current ? '0 0 0 4px var(--pl)' : 'none',
              }}>
                {done ? <span style={{ fontSize: 16 }}>{step.icon}</span> : <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: current ? 800 : 500, color: done ? 'var(--p)' : 'var(--tx3)', whiteSpace: 'nowrap' }}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { addItem, clearCart } = useCartStore();
  const [orders,   setOrders]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => {
    refreshBus.listeners.push(fetchOrders);
    return () => { refreshBus.listeners = refreshBus.listeners.filter(fn => fn !== fetchOrders); };
  }, []);

  const fetchOrders = async () => {
    try { const { data } = await api.get('/orders'); setOrders(data); }
    catch { toast.error('خطأ في تحميل الطلبات'); }
    setLoading(false);
  };

  const handleReorder = (order: any) => {
    clearCart();
    order.items?.forEach((item: any) => {
      addItem({
        productId:     item.productId,
        name:          item.productName,
        price:         item.price,
        quantity:      item.quantity,
        warehouseId:   order.warehouseId,
        warehouseName: order.warehouse?.name || '',
      });
    });
    toast.success('✅ تمت إضافة المنتجات للسلة');
    navigate('/cart');
  };

  const fmt     = (n: number) => new Intl.NumberFormat('ar-SY').format(n) + ' ل.س';
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 طلباتي</h1>
          <div className="page-sub">{orders.length} طلب إجمالاً</div>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-text">لا توجد طلبات بعد</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {orders.map(order => {
            const s = statusMap[order.status] || statusMap.pending;
            return (
              <div key={order.id} className="order-card">
                {/* Header */}
                <div className="order-header" style={{ cursor: 'pointer' }} onClick={() => setSelected(order)}>
                  <span className={`badge ${s.cls}`}>{s.icon} {s.label}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div className="order-number">{order.orderNumber}</div>
                    <div className="order-date">{fmtDate(order.createdAt)}</div>
                  </div>
                </div>

                {/* شريط التتبع */}
                <OrderTracker status={order.status} />

                {/* المنتجات */}
                <div className="order-items" style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: 'var(--p)' }}>🏭 {order.warehouse?.name}</div>
                  {order.items?.slice(0, 2).map((item: any) => (
                    <div key={item.id} className="order-item-row">
                      <span style={{ color: 'var(--p)', fontWeight: 600 }}>{item.quantity} × {fmt(item.price)}</span>
                      <span>{item.productName}</span>
                    </div>
                  ))}
                  {order.items?.length > 2 && (
                    <div style={{ fontSize: 12, color: 'var(--tx3)', textAlign: 'right', marginTop: 3 }}>+{order.items.length - 2} منتجات أخرى</div>
                  )}
                </div>

                {/* Footer */}
                <div className="order-footer">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setSelected(order)}>التفاصيل</button>
                    <button className="btn-green" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleReorder(order)}>🔄 إعادة الطلب</button>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--p)', fontSize: 15 }}>{fmt(order.totalAmount)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal التفاصيل */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
              <div style={{ textAlign: 'right' }}>
                <div className="modal-title">تفاصيل الطلب</div>
                <div style={{ fontSize: 13, color: 'var(--tx2)' }}>{selected.orderNumber}</div>
              </div>
            </div>

            {/* شريط التتبع في الـ modal */}
            <div style={{ marginBottom: 20 }}>
              <OrderTracker status={selected.status} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>المنتجات ({selected.items?.length})</div>
              {selected.items?.map((item: any) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bdr2)', fontSize: 14 }}>
                  <span style={{ color: 'var(--p)', fontWeight: 600 }}>{fmt(item.price * item.quantity)}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span>{item.productName}</span>
                    <span style={{ color: 'var(--tx3)' }}> × {item.quantity}</span>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 800, fontSize: 16 }}>
                <span style={{ color: 'var(--p)' }}>{fmt(selected.totalAmount)}</span>
                <span>المجموع</span>
              </div>
            </div>

            {selected.notes && (
              <div style={{ background: 'var(--s2)', borderRadius: 'var(--r1)', padding: 12, fontSize: 13, color: 'var(--tx2)', marginBottom: 12 }}>
                📝 {selected.notes}
              </div>
            )}

            <button className="btn-primary" onClick={() => { handleReorder(selected); setSelected(null); }}>
              🔄 إعادة هذا الطلب
            </button>
          </div>
        </div>
      )}
    </>
  );
}