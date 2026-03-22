// src/components/WarehouseCard/WarehouseCard.tsx
import { IconWarehouse, IconPin } from '../Icons';
import { Warehouse } from '../../pages/HomePage';

interface WarehouseCardProps {
  warehouse: Warehouse;
  onClick: () => void;
}

export default function WarehouseCard({ warehouse, onClick }: WarehouseCardProps) {
  return (
    <div className="warehouse-card" onClick={onClick}>
      {/* Logo */}
      <div className="warehouse-card-logo">
        {warehouse.logo ? (
          <img src={warehouse.logo} alt={warehouse.name} />
        ) : (
          <span
            className="warehouse-card-logo-placeholder"
            style={{ color: 'var(--p)' }}
          >
            <IconWarehouse size={28} />
          </span>
        )}
      </div>

      {/* Info */}
      <div className="warehouse-card-body">
        <div className="warehouse-card-name">{warehouse.name}</div>
        <div
          className="warehouse-card-loc"
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <IconPin size={12} /> {warehouse.location}
        </div>
        {warehouse.description && (
          <div className="warehouse-card-desc">{warehouse.description}</div>
        )}
      </div>

      {/* Arrow */}
      <div className="warehouse-card-arrow">←</div>
    </div>
  );
}
