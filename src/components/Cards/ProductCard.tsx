// components/ProductCard.tsx

import { Product } from "../../pages/WarehousePage";
import { IconHeart, IconPill } from "../Icons";

interface ProductCardProps {
    product: Product;
    onToggleFav: (productId: number) => void;
    onAdd: (p: Product) => void;
    favIds: number[];
    setModalImg: (img: string | null) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
    product: p,
    onToggleFav,
    onAdd,
    favIds,
    setModalImg,
}) => {
    const fmt = (n: number) =>
        new Intl.NumberFormat("ar-SY").format(n) + " ل.س";

    return (
        <div key={p.id} className="product-card">
            <div className="product-body">
                <div
                    className="product-img"
                    onClick={() => p.imageUrl && setModalImg(p.imageUrl)}
                    style={{ cursor: p.imageUrl ? "zoom-in" : "default" }}
                >
                    {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} />
                    ) : (
                        <span style={{ color: "var(--p)" }}>
                            <IconPill size={36} />
                        </span>
                    )}
                </div>

                <div className="product-info">
                    <div className="product-name">{p.name}</div>
                    {p.scientificName && (
                        <div className="product-sci">{p.scientificName}</div>
                    )}
                    {p.company && <div className="product-co">{p.company}</div>}

                    <div className="product-bottom">
                        <div className="product-price-col">
                            <span className="product-price">{fmt(p.price)}</span>
                        </div>
                        <button className="product-add-btn" onClick={() => onAdd(p)}>
                            {"+ سلة"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="product-footer" style={{ justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 6 }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFav(p.id);
                        }}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: favIds.includes(p.id)
                                ? "#ef4444"
                                : "var(--tx3)",
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <IconHeart size={16} />
                    </button>
                </div>
                <span className="product-footer-meta">
                    📂 {p.category?.name}
                </span>
            </div>
        </div>
    );
};

export default ProductCard;
