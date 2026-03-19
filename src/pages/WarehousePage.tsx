import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useCartStore } from '../store/cartStore';

interface Category  { id: number; name: string; warehouseId: number; }
interface Product   { id: number; imageUrl: string; name: string; scientificName: string; company: string; price: number; stock: number; unit: string; warehouseId: number; categoryId: number; warehouse: { name: string }; category: { name: string }; }
interface Warehouse { id: number; name: string; location: string; logo: string | null; }

export default function WarehousePage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { addItem }  = useCartStore();

  const [warehouse,       setWarehouse]       = useState<Warehouse | null>(null);
  const [categories,      setCategories]      = useState<Category[]>([]);
  const [allProducts,     setAllProducts]     = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [selectedCategory,setSelectedCategory]= useState<number | null>(null);
  const [search,          setSearch]          = useState('');
  const [loading,         setLoading]         = useState(true);
  const [loadingProds,    setLoadingProds]     = useState(false);
  const [loadingMore,     setLoadingMore]     = useState(false);
  
  // Pagination
  const PRODUCTS_PER_PAGE = 20;
  const [displayCount,    setDisplayCount]    = useState(PRODUCTS_PER_PAGE);

  // Load warehouse info + categories once
  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/warehouses/${id}`),
      api.get('/categories', { params: { warehouseId: id } }),
    ]).then(([w, c]) => {
      setWarehouse(w.data);
      setCategories(c.data);
    }).catch(() => toast.error('خطأ في التحميل'))
      .finally(() => setLoading(false));
  }, [id]);

  // Load products when filters change
  useEffect(() => {
    if (!id) return;
    setDisplayCount(PRODUCTS_PER_PAGE); // Reset display count on filter change
    fetchProducts();
  }, [id, selectedCategory, search]);

  // Update displayed products when allProducts or displayCount changes
  useEffect(() => {
    setDisplayedProducts(allProducts.slice(0, displayCount));
  }, [allProducts, displayCount]);

  useEffect(() => {
    api.get('/favorites/ids').then(r => setFavIds(r.data)).catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setLoadingProds(true);
    try {
      const params: any = { active: 'true', warehouseId: id };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (search)           params.search      = search;
      const { data } = await api.get('/products', { params });
      setAllProducts(data);
      setDisplayCount(PRODUCTS_PER_PAGE);
    } catch { toast.error('خطأ في تحميل المنتجات'); }
    setLoadingProds(false);
  };

  const loadMore = () => {
    if (!loadingMore && displayCount < allProducts.length) {
      setLoadingMore(true);
      setTimeout(() => {
        setDisplayCount(prev => Math.min(prev + PRODUCTS_PER_PAGE, allProducts.length));
        setLoadingMore(false);
      }, 300);
    }
  };

  const toggleFav = async (productId: number) => {
    try {
      if (favIds.includes(productId)) {
        await api.delete(`/favorites/${productId}`);
        setFavIds(prev => prev.filter(id => id !== productId));
      } else {
        await api.post(`/favorites/${productId}`, {});
        setFavIds(prev => [...prev, productId]);
      }
    } catch {}
  };

  const handleAdd = (p: Product) => {
    if (p.stock <= 0) { toast.error('المنتج غير متوفر'); return; }
    addItem({ productId: p.id, name: p.name, price: p.price, quantity: 1, warehouseId: p.warehouseId, warehouseName: p.warehouse?.name || '' });
    toast.success(`✅ تمت الإضافة: ${p.name}`);
  };

  const [modalImg,  setModalImg]  = useState<string | null>(null);
  const [favIds,    setFavIds]    = useState<number[]>([]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  function fmt(price: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  }

  return (
    <>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'var(--bg)', border: '1.5px solid var(--bdr)', borderRadius: 'var(--r1)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', flexShrink: 0, color: 'var(--tx2)', fontWeight: 700 }}
        >
          ←
        </button>
        {warehouse?.logo ? (
          <img src={warehouse.logo} alt={warehouse.name} style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--bdr)', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 38, height: 38, borderRadius: 8, background: 'linear-gradient(135deg, var(--pl), var(--pf))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏭</div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{warehouse?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--tx2)' }}>📍 {warehouse?.location}</div>
        </div>
      </div>

      {/* ── Category chips ── */}
      <div className="cat-bar" style={{ marginBottom: 16 }}>
        <button
          className={`cat-chip${!selectedCategory ? ' active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          الكل
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            className={`cat-chip${selectedCategory === c.id ? ' active' : ''}`}
            onClick={() => setSelectedCategory(prev => prev === c.id ? null : c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="search-bar" style={{ marginBottom: 16 }}>
        <input
          placeholder="🔍 بحث باسم الدواء، الاسم العلمي، الشركة..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* ── Count ── */}
      <div style={{ fontSize: 13, color: 'var(--tx2)', fontWeight: 600, marginBottom: 14 }}>
        {loadingProds ? '...' : `${displayedProducts.length} من ${allProducts.length} منتج`}
        {selectedCategory && (
          <span style={{ marginRight: 8, background: 'var(--pl)', color: 'var(--pd)', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>
            {categories.find(c => c.id === selectedCategory)?.name}
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 4, color: 'var(--pd)', fontSize: 11 }} onClick={() => setSelectedCategory(null)}>✕</button>
          </span>
        )}
      </div>

      {/* ── Products ── */}
      {loadingProds ? (
        <div className="loading"><div className="spinner" /></div>
      ) : allProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-text">لا توجد منتجات</div>
          <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 6 }}>جرب تغيير الفلاتر أو البحث</div>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {displayedProducts.map(p => (
              <div key={p.id} className="product-card">
                    <div className="product-body">
                      <div className="product-img"
                        onClick={() => p.imageUrl && setModalImg(p.imageUrl)}
                        style={{ cursor: p.imageUrl ? 'zoom-in' : 'default' }}
                      >
                        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" /> : <span>💊</span>}
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
                          <button
                            className="product-add-btn"
                            onClick={() => handleAdd(p)}
                            disabled={p.stock <= 0}
                          >
                            {p.stock > 0 ? '+ سلة' : 'نفد'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="product-footer" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={e => { e.stopPropagation(); toggleFav(p.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                          title={favIds.includes(p.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                        >
                          {favIds.includes(p.id) ? '❤️' : '🤍'}
                        </button>
                        {p.stock <= 0 && (
                          <button
                            onClick={e => { e.stopPropagation(); api.post(`/stock-alerts/${p.id}`, {}).then(() => { /* toast */ }).catch(() => {}); }}
                            style={{ background: 'var(--pl)', color: 'var(--pd)', border: 'none', borderRadius: 'var(--r1)', padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            🔔 نبّهني
                          </button>
                        )}
                      </div>
                      <span className="product-footer-meta">📂 {p.category?.name}</span>
                    </div>
                  </div>
            ))}
          </div>

          {/* Show More Button */}
          {displayCount < allProducts.length && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  maxWidth: 300,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 700,
                  background: loadingMore ? 'var(--bdr)' : 'var(--navy)',
                  color: loadingMore ? 'var(--tx3)' : 'white',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  opacity: loadingMore ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {loadingMore ? '⏳ جاري التحميل...' : `📥 عرض المزيد (${allProducts.length - displayCount} متبقي)`}
              </button>
            </div>
          )}
        </>
      )}
      {/* ── Image Modal ── */}
      {modalImg && (
        <div
          onClick={() => setModalImg(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'phFade .2s ease' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: 420, width: '100%' }}>
            <img src={modalImg} alt="صورة المنتج"
              style={{ width: '100%', borderRadius: 'var(--r3)', boxShadow: 'var(--sh3)', display: 'block' }} />
            <button
              onClick={() => setModalImg(null)}
              style={{ position: 'absolute', top: -14, left: -14, width: 34, height: 34, borderRadius: '50%', background: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh2)' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}