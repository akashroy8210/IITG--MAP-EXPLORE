import BentoCard from './BentoCard';

export default function StatCard({
  title,
  value,
  trend,
  trendType = 'up',
  icon = '📊',
  variant = 'white',
  span = 'bento-span-3',
}) {
  return (
    <BentoCard variant={variant} span={span}>
      <div className="card-header-row" style={{ marginBottom: 12 }}>
        <h4 className="card-title">{title}</h4>
        <div className="card-icon-badge">{icon}</div>
      </div>

      <div className="stat-value">{value}</div>

      {trend && (
        <div className={`stat-trend ${trendType}`}>
          <span>{trendType === 'up' ? '▲' : '●'}</span>
          <span>{trend}</span>
        </div>
      )}
    </BentoCard>
  );
}
