import { IconHeart, IconPill } from '../components/Icons';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useCartStore } from '../store/cartStore';

export default function FavoritesPage() {
    const navigate = useNavigate();
    const { addItem } = useCartStore();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalImg, setModalImg] = useState<string | null>(null);

    useEffect(() => { fetchFavs(); }, []);

    const fetchFavs = async () => {
        try { const { data } = await api.get('/favorites'); setProducts(data); }
        catch { toast.error('خطأ في التحميل'); }
        setLoading(false);
    };

    const removeFav = async (productId: number) => {
        try {
            await api.delete(`/favorites/${productId}`);
            setProducts(prev => prev.filter(p => p.id !== productId));
            toast.success('تمت الإزالة من المفضلة');
        } catch { }
    };

    const handleAdd = (p: any) => {
        addItem({ productId: p.id, name: p.name, price: p.price, quantity: 1, warehouseId: p.warehouseId, warehouseName: p.warehouse?.name || '' });
        toast.success(`تمت الإضافة: ${p.name}`);
    };

    const fmt = (n: number) => new Intl.NumberFormat('ar-SY').format(n) + ' ل.س';

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">المفضلة</h1>
                    <div className="page-sub">{products.length} منتج محفوظ</div>
                </div>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner" /></div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon" style={{ color: "var(--tx3)" }}><IconHeart size={40} /></div>
                    <div className="empty-text">لا توجد منتجات في المفضلة</div>
                    <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 6, marginBottom: 20 }}>اضغط على قلب أي منتج لحفظه هنا</div>
                    <button className="btn-green" onClick={() => navigate('/')}>تصفح المنتجات</button>
                </div>
            ) : (
                <div className="products-grid">
                    {products.map(p => (
                        <div key={p.id} className="product-card">
                            <div className="product-body">
                                <div className="product-img" onClick={() => p.imageUrl && setModalImg(p.imageUrl)} style={{ cursor: p.imageUrl ? 'zoom-in' : 'default' }}>
                                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : <span style={{ color: 'var(--p)' }}><IconPill size={32} /></span>}
                                </div>
                                <div className="product-info">
                                    <div className="product-name">{p.name}</div>
                                    {p.scientificName && <div className="product-sci">{p.scientificName}</div>}
                                    {p.company && <div className="product-co">{p.company}</div>}
                                    <div className="product-bottom">
                                        <div className="product-price-col">
                                            <span className="product-price">{fmt(p.price)}</span>
                                            <span className={'product-stock-ok'}>
                                                {`✓ متوفر`}
                                            </span>
                                        </div>
                                        <button className="product-add-btn" onClick={() => handleAdd(p)} >
                                            {`+ سلة`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="product-footer" style={{ justifyContent: 'space-between' }}>
                                <button
                                    onClick={() => removeFav(p.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}
                                >
                                    <IconHeart size={16} />
                                </button>
                                <span className="product-footer-meta">📂 {p.category?.name} • {p.warehouse?.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modalImg && (
                <div onClick={() => setModalImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <img src={modalImg} alt="" style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: 'var(--r3)', objectFit: 'contain' }} />
                </div>
            )}
        </>
    );
}
