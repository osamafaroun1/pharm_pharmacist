import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useCartStore } from '../store/cartStore';
import { refreshBus } from '../components/Layout';
import { IconArrowLeft, IconWarehouse } from '../components/Icons';
import ProductCard from '../components/Cards/ProductCard';

interface Category { id: number; name: string; warehouseId: number; }
export interface Product {
    id: number; name: string; scientificName: string; company: string;
    price: number; unit: string; warehouseId: number; categoryId: number;
    imageUrl: string | null;
    warehouse: { name: string };
    category: { name: string };
}
interface Warehouse { id: number; name: string; location: string; logo: string | null; }

const PAGE_SIZE = 20;

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
};

export default function WarehousePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addItem } = useCartStore();

    const [warehouse, setWarehouse]       = useState<Warehouse | null>(null);
    const [categories, setCategories]     = useState<Category[]>([]);
    const [products, setProducts]         = useState<Product[]>([]);
    const [favIds, setFavIds]             = useState<number[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    const [search, setSearch]             = useState('');
    const debouncedSearch                 = useDebounce(search, 350);

    // حالة تحميل واحدة فقط للـ initial load
    const [loading, setLoading]           = useState(true);
    const [loadingMore, setLoadingMore]   = useState(false);
    // spinner صغير داخل حقل البحث فقط (لا يؤثر على الـ grid)
    const [isSearching, setIsSearching]   = useState(false);

    const [page, setPage]                 = useState(1);
    const [hasMore, setHasMore]           = useState(false);
    const [total, setTotal]               = useState(0);
    const [modalImg, setModalImg]         = useState<string | null>(null);

    // نعلم هل الـ initial load انتهى أم لا — لتجنب تشغيل effect الفلاتر قبل الأوان
    const initialLoadDone = useRef(false);

    // ── دالة جلب المنتجات فقط (بدون warehouse/categories) ──
    const fetchProducts = useCallback(async (
        p: number, reset: boolean, searchTerm: string, categoryId: number | null
    ) => {
        reset ? setIsSearching(true) : setLoadingMore(true);

        try {
            const params: Record<string, unknown> = {
                active: 'true', warehouseId: id,
                page: p, limit: PAGE_SIZE,
            };
            if (categoryId) params.categoryId = categoryId;
            if (searchTerm)  params.search     = searchTerm;

            const { data } = await api.get('/products', { params });
            const incoming: Product[] = Array.isArray(data) ? data : (data.products || []);

            setProducts(prev => reset ? incoming : [...prev, ...incoming]);
            setHasMore(Array.isArray(data) ? false : (data.hasMore ?? false));
            setTotal(Array.isArray(data)   ? incoming.length : (data.total ?? incoming.length));
        } catch {
            toast.error('خطأ في تحميل المنتجات');
        } finally {
            setIsSearching(false);
            setLoadingMore(false);
        }
    }, [id]);

    // ══════════════════════════════════════════════════════════════
    //  Effect 1 — Initial Load (warehouse + categories + products)
    //  يعمل مرة واحدة فقط عند تغيير id
    //  → تحميل كل شيء معاً في Promise.all واحد = re-render واحد
    // ══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!id) return;
        initialLoadDone.current = false;
        setLoading(true);
        setProducts([]);     // reset بدون flash (loading=true يخفي الـ grid)
        setPage(1);
        setSelectedCategory(null);
        setSearch('');

        let cancelled = false;

        (async () => {
            try {
                const [wRes, cRes, fRes, pRes] = await Promise.all([
                    api.get(`/warehouses/${id}`),
                    api.get('/categories', { params: { warehouseId: id } }),
                    api.get('/favorites/ids'),
                    api.get('/products', {
                        params: { active: 'true', warehouseId: id, page: 1, limit: PAGE_SIZE },
                    }),
                ]);

                if (cancelled) return;

                const data = pRes.data;
                const incoming: Product[] = Array.isArray(data) ? data : (data.products || []);

                // batch واحد = re-render واحد
                setWarehouse(wRes.data);
                setCategories(cRes.data);
                setFavIds(fRes.data);
                setProducts(incoming);
                setHasMore(Array.isArray(data) ? false : (data.hasMore ?? false));
                setTotal(Array.isArray(data)   ? incoming.length : (data.total ?? incoming.length));
            } catch {
                if (!cancelled) toast.error('خطأ في تحميل البيانات');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    initialLoadDone.current = true;
                }
            }
        })();

        return () => { cancelled = true; };
    }, [id]);

    // ══════════════════════════════════════════════════════════════
    //  Effect 2 — Filter Changes (category / search)
    //  لا يعمل إلا بعد انتهاء الـ initial load
    // ══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!initialLoadDone.current) return;
        setPage(1);
        fetchProducts(1, true, debouncedSearch, selectedCategory);
    }, [debouncedSearch, selectedCategory]);         // ← id مستبعد عن قصد

    // ══════════════════════════════════════════════════════════════
    //  Effect 3 — Load More (page > 1 فقط)
    // ══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!initialLoadDone.current || page === 1) return;
        fetchProducts(page, false, debouncedSearch, selectedCategory);
    }, [page]);

    // ── Pull-to-Refresh ──
    useEffect(() => {
        const refresh = () => {
            setPage(1);
            fetchProducts(1, true, debouncedSearch, selectedCategory);
        };
        refreshBus.listeners.push(refresh);
        return () => { refreshBus.listeners = refreshBus.listeners.filter(fn => fn !== refresh); };
    }, [fetchProducts, debouncedSearch, selectedCategory]);

    // ── Handlers ──
    const handleAdd = (p: Product) => {
        addItem({
            productId: p.id, name: p.name, price: p.price, quantity: 1,
            warehouseId: p.warehouseId, warehouseName: p.warehouse?.name || '',
        });
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
        } catch { /* silent */ }
    };

    const statusText = (() => {
        if (loading)                              return 'جاري التحميل...';
        if (isSearching)                          return `جاري البحث عن "${search}"...`;
        if (debouncedSearch && !products.length)  return `لا توجد نتائج لـ "${debouncedSearch}"`;
        if (debouncedSearch)                      return `${products.length} نتيجة لـ "${debouncedSearch}" من أصل ${total}`;
        return `${products.length} من ${total} منتج`;
    })();

    // ── Initial loading screen ──
    if (loading) return <div className="loading"><div className="spinner" /></div>;

    return (
        <>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'var(--bg)', border: '1.5px solid var(--bdr)',
                        borderRadius: 'var(--r1)', width: 36, height: 36,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--tx2)',
                    }}
                >
                    <IconArrowLeft size={18} />
                </button>

                {warehouse?.logo ? (
                    <img src={warehouse.logo} alt={warehouse.name}
                        style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--bdr)' }} />
                ) : (
                    <div style={{
                        width: 38, height: 38, borderRadius: 8,
                        background: 'linear-gradient(135deg,var(--pl),var(--pf))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p)',
                    }}>
                        <IconWarehouse size={20} />
                    </div>
                )}

                <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{warehouse?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--tx2)' }}>📍 {warehouse?.location}</div>
                </div>
            </div>

            {/* ── Category Chips ── */}
            <div className="cat-bar" style={{ marginBottom: 14 }}>
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

            {/* ── Search Bar ── */}
            <div
                className="search-bar"
                style={{
                    marginBottom: 14,
                    boxShadow: isSearching ? '0 0 0 2px var(--p)' : undefined,
                    transition: 'box-shadow 0.2s',
                }}
            >
                <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 20, height: 20, flexShrink: 0,
                    color: isSearching ? 'var(--p)' : 'var(--tx3)',
                    transition: 'color 0.2s',
                }}>
                    {isSearching
                        ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                        : (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <circle cx="11" cy="11" r="7" />
                                <line x1="16.5" y1="16.5" x2="22" y2="22" />
                            </svg>
                        )}
                </span>

                <input
                    placeholder="بحث باسم الدواء، الاسم العلمي، الشركة..."
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        if (e.target.value) setIsSearching(true);
                        else setIsSearching(false);
                    }}
                    style={{ flex: 1 }}
                />

                {search && (
                    <button
                        className="btn-ghost"
                        onClick={() => { setSearch(''); setIsSearching(false); }}
                        style={{ flexShrink: 0 }}
                        aria-label="مسح البحث"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* ── عداد النتائج ── */}
            <div style={{
                fontSize: 13,
                color: isSearching ? 'var(--p)' : 'var(--tx2)',
                fontWeight: 600, marginBottom: 14, minHeight: 20,
                transition: 'color 0.2s',
            }}>
                {statusText}
            </div>

            {/* ── Products Grid ── */}
            {products.length === 0 && !isSearching ? (
                <div className="empty-state">
                    <div className="empty-icon" style={{ color: 'var(--tx3)' }}>
                        <IconWarehouse size={40} />
                    </div>
                    <div className="empty-text">
                        {debouncedSearch ? `لا توجد نتائج لـ "${debouncedSearch}"` : 'لا توجد منتجات'}
                    </div>
                    {debouncedSearch && (
                        <button
                            className="btn-ghost"
                            onClick={() => { setSearch(''); setIsSearching(false); }}
                            style={{ marginTop: 10, fontSize: 13 }}
                        >
                            مسح البحث والعودة لكل المنتجات
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="products-grid">
                        {products.map(p => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                onToggleFav={toggleFav}
                                onAdd={handleAdd}
                                favIds={favIds}
                                setModalImg={setModalImg}
                            />
                        ))}
                    </div>

                    {hasMore && (
                        <div style={{ textAlign: 'center', margin: '24px 0' }}>
                            <button
                                onClick={() => setPage(prev => prev + 1)}
                                disabled={loadingMore}
                                className="btn-primary"
                            >
                                {loadingMore
                                    ? 'جاري التحميل...'
                                    : `عرض المزيد (${total - products.length} متبقي)`}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ── Image Modal ── */}
            {modalImg && (
                <div
                    onClick={() => setModalImg(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
                        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <img src={modalImg} alt=""
                        style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: 'var(--r3)' }} />
                </div>
            )}
        </>
    );
}