import './SkeletonLoader.css';

export function SkeletonBlock({ width = '100%', height = '16px', radius = '8px' }) {
  return (
    <div
      className="skeleton-block"
      style={{ width, height, borderRadius: radius }}
    />
  );
}

export function SkeletonCircle({ size = '40px' }) {
  return (
    <div
      className="skeleton-circle"
      style={{ width: size, height: size, borderRadius: '50%' }}
    />
  );
}

export function SkeletonStats() {
  return (
    <div className="skeleton-stats" role="status" aria-label="Загрузка статистики">
      <div className="skeleton-stats-grid">
        <div className="skeleton-card-w">
          <SkeletonBlock width="55%" height="14px" />
          <SkeletonBlock width="35%" height="32px" radius="10px" />
        </div>
        <div className="skeleton-card-w">
          <SkeletonBlock width="55%" height="14px" />
          <SkeletonBlock width="35%" height="32px" radius="10px" />
        </div>
        <div className="skeleton-card-w">
          <SkeletonBlock width="55%" height="14px" />
          <SkeletonBlock width="35%" height="32px" radius="10px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonConsultationList({ count = 3 }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Загрузка списка консультаций">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <div className="skeleton-list-content">
            <SkeletonBlock width="45%" height="16px" />
            <SkeletonBlock width="30%" height="13px" />
            <SkeletonBlock width="25%" height="13px" />
          </div>
          <div className="skeleton-list-actions">
            <SkeletonBlock width="80px" height="32px" radius="8px" />
            <SkeletonBlock width="80px" height="32px" radius="8px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonAppointmentsList({ count = 3 }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Загрузка записей">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <div className="skeleton-list-content">
            <SkeletonBlock width="40%" height="16px" />
            <SkeletonBlock width="25%" height="13px" />
          </div>
          <SkeletonBlock width="100px" height="36px" radius="8px" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="skeleton-table-wrap" role="status" aria-label="Загрузка таблицы">
      <SkeletonBlock width="180px" height="24px" radius="8px" />
      <div className="skeleton-table-rows">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-table-row">
            <SkeletonBlock width="18%" height="12px" />
            <SkeletonBlock width="22%" height="12px" />
            <SkeletonBlock width="22%" height="12px" />
            <SkeletonBlock width="18%" height="12px" />
          </div>
        ))}
      </div>
    </div>
  );
}
