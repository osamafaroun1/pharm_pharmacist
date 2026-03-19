import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useCartStore } from '../store/cartStore';
import { refreshBus } from '../components/Layout';

interface Category  { id: number; name: string; warehouseId: number; }
interface Product   { id: number; name: string; scientificName: string; company: string; price: number; stock: number; unit: string; warehouseId: number; categoryId: number; imageUrl: string | null; warehouse: { name: string }; category: { name: string }; }
interface Warehouse { id: number; name: string; location: string; logo: string | null; }

const PAGE_SIZE = 20;
const asArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value : [];

export default function WarehousePage() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const { addItem } = useCartStore();

  const [warehouse,        setWarehouse]        = useState<Warehouse | null>(null);
  const [categories,       setCategories]       = useState<Category[]>([]);
  const [products,         setProducts]         = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search,           setSearch]           = useState('');
  const [loading,          setLoading]          = useState(true);
  const [loadingMore,      setLoadingMore]       = useState(false);
  const [page,             setPage]             = useState(1);
  const [hasMore,          setHasMore]          = useState(false);
  const [total,            setTotal]            = useState(0);
  const [modalImg,         setModalImg]         = useState<string | null>(null);
  const [favIds,           setFavIds]           = useState<number[]>([]);

  // تحميل المستودع والتصنيفات
  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/warehouses/${id}`),
      api.get('/categories', { params: { warehouseId: id } }),
      api.get('/favorites/ids'),
    ]).then(([w, c, f]) => {
      setWarehouse(w.data);
      setCategories(asArray<Category>(c.data));
      setFavIds(asArray<number>(f.data));
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // تحميل المنتجات عند تغيير الفلاتر — reset page
  useEffect(() => {
    setPage(1);
    setProducts([]);
  }, [id, selectedCategory, search]);

  // تحميل عند تغيير page
  useEffect(() => {
    if (!id) return;
    fetchProducts(page, page === 1);
  }, [id, selectedCategory, search, page]);

  // refresh bus
  useEffect(() => {
    const refresh = () => { setPage(1); setProducts([]); };
    refreshBus.listeners.push(refresh);
    return () => { refreshBus.listeners = refreshBus.listeners.filter(fn => fn !== refresh); };
  }, []);

  const fetchProducts = async (p: number, reset: boolean) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const params: any = { active: 'true', warehouseId: id, page: p, limit: PAGE_SIZE };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (search)           params.search      = search;
      const { data } = await api.get('/products', { params });
      const productSource = Array.isArray(data) ? data : data?.products;
      const newProducts = asArray<Product>(productSource);
      setProducts(prev => reset ? newProducts : [...asArray<Product>(prev), ...newProducts]);
      setHasMore(Array.isArray(data) ? false : Boolean(data?.hasMore));
      setTotal(Array.isArray(data) ? newProducts.length : Number(data?.total ?? newProducts.length));
    } catch { toast.error('خطأ في تحميل المنتجات'); }
    setLoading(false);
    setLoadingMore(false);
  };

  const handleAdd = (p: Product) => {
    if (p.stock <= 0) { toast.error('المنتج غير متوفر'); return; }
    addItem({ productId: p.id, name: p.name, price: p.price, quantity: 1, warehouseId: p.warehouseId, warehouseName: p.warehouse?.name || '' });
    toast.success(`✅ تمت الإضافة: ${p.name}`);
  };

  const toggleFav = async (productId: number) => {
    try {
      if (favIds.includes(productId)) {
        await api.delete(`/favorites/${productId}`);
        setFavIds(prev => prev.filter(i => i !== productId));
      } else {
        await api.post(`/favorites/${productId}`, {});
        setFavIds(prev => [...prev, productId]);
      }
    } catch {}
  };

  const fmt = (n: number) => new Intl.NumberFormat('ar-SY').format(n) + ' ل.س';

  if (loading && products.length === 0) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)}
          style={{ background: 'var(--bg)', border: '1.5px solid var(--bdr)', borderRadius: 'var(--r1)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', flexShrink: 0, color: 'var(--tx2)', fontWeight: 700 }}>
          ←
        </button>
        {warehouse?.logo
          ? <img src={warehouse.logo} alt={warehouse.name} style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--bdr)', flexShrink: 0 }} />
          : <div style={{ width: 38, height: 38, borderRadius: 8, background: 'linear-gradient(135deg,var(--pl),var(--pf))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏭</div>
        }
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{warehouse?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--tx2)' }}>📍 {warehouse?.location}</div>
        </div>
      </div>

      {/* Category chips */}
      <div className="cat-bar" style={{ marginBottom: 14 }}>
        <button className={`cat-chip${!selectedCategory ? ' active' : ''}`} onClick={() => setSelectedCategory(null)}>الكل</button>
        {categories.map(c => (
          <button key={c.id} className={`cat-chip${selectedCategory === c.id ? ' active' : ''}`}
            onClick={() => setSelectedCategory(prev => prev === c.id ? null : c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 14 }}>
        <input placeholder="🔍 بحث باسم الدواء، الاسم العلمي، الشركة..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => setSearch('')}>✕</button>}
      </div>

      {/* Count */}
      <div style={{ fontSize: 13, color: 'var(--tx2)', fontWeight: 600, marginBottom: 14 }}>
        {loading ? '...' : `${products.length} من ${total} منتج`}
        {selectedCategory && (
          <span style={{ marginRight: 8, background: 'var(--pl)', color: 'var(--pd)', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>
            {categories.find(c => c.id === selectedCategory)?.name}
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 4, color: 'var(--pd)', fontSize: 11 }} onClick={() => setSelectedCategory(null)}>✕</button>
          </span>
        )}
      </div>

      {/* Products */}
      {products.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-text">لا توجد منتجات</div>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.map(p => (
              <div key={p.id} className="product-card">
                <div className="product-body">
                  <div className="product-img"
                    onClick={() => p.imageUrl && setModalImg(p.imageUrl)}
                    style={{ cursor: p.imageUrl ? 'zoom-in' : 'default' }}>
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : <span>💊</span>}
                  </div>
                  <div className="product-info">
                    <div className="product-name">{p.name}</div>
                    {p.scientificName && <div className="product-sci">{p.scientificName}</div>}
                    {p.company        && <div className="product-co">{p.company}</div>}
                    <div className="product-bottom">
                      <div className="product-price-col">
                        <span className="product-price">{fmt(p.price)}</span>
                        <span className={p.stock > 0 ? 'product-stock-ok' : 'product-stock-out'}>
                          {p.stock > 0 ? `✓ متوفر (${p.stock})` : '✗ نفد'}
                        </span>
                      </div>
                      <button className="product-add-btn" onClick={() => handleAdd(p)} disabled={p.stock <= 0}>
                        {p.stock > 0 ? '+ سلة' : 'نفد'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="product-footer" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); toggleFav(p.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
                      {favIds.includes(p.id) ? '❤️' : '🤍'}
                    </button>
                    {p.stock <= 0 && (
                      <button onClick={() => api.post(`/stock-alerts/${p.id}`, {}).catch(() => {})}
                        style={{ background: 'var(--pl)', color: 'var(--pd)', border: 'none', borderRadius: 'var(--r1)', padding: '2px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                        🔔 نبّهني
                      </button>
                    )}
                  </div>
                  <span className="product-footer-meta">📂 {p.category?.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* عرض المزيد */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 8 }}>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={loadingMore}
                style={{ background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 'var(--r2)', padding: '12px 32px', fontFamily: 'Cairo', fontWeight: 700, fontSize: 14, cursor: loadingMore ? 'not-allowed' : 'pointer', opacity: loadingMore ? .7 : 1, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {loadingMore ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> جاري التحميل...</> : `عرض المزيد (${total - products.length} متبقي)`}
              </button>
            </div>
          )}

          {!hasMore && products.length > PAGE_SIZE && (
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--tx3)' }}>
              ✅ تم عرض جميع المنتجات ({total})
            </div>
          )}
        </>
      )}

      {/* Image modal */}
      {modalImg && (
        <div onClick={() => setModalImg(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={modalImg} alt="" style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: 'var(--r3)', objectFit: 'contain' }} />
        </div>
      )}
    </>
  );
}
