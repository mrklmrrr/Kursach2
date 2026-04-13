export default function EmptyState({ icon = 'inbox', title, description }) {
  return (
    <div className="empty-state">
      <span className="material-icons empty-icon">{icon}</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
