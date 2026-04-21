import './EmptyState.css';

/**
 * Пустое состояние в едином стиле дизайн-системы.
 * @param {'card'|'plain'} variant — card: рамка и фон; plain: компактно внутри секций.
 */
export default function EmptyState({ icon = 'inbox', title, description, action, variant = 'card', className = '' }) {
  const rootClass = ['ui-empty-state', `ui-empty-state--${variant}`, className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} role="status">
      <span className="material-icons ui-empty-icon" aria-hidden>
        {icon}
      </span>
      <h3 className="ui-empty-title">{title}</h3>
      {description ? <p className="ui-empty-desc">{description}</p> : null}
      {action ? <div className="ui-empty-action">{action}</div> : null}
    </div>
  );
}
