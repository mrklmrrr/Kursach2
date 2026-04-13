export default function BackButton({ onClick, label = 'Назад' }) {
  return (
    <button className="back-btn" onClick={onClick}>
      <span className="material-icons">arrow_back</span> {label}
    </button>
  );
}
