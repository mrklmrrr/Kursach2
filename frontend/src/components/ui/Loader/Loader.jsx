import './Loader.css';

export default function Loader({ text = 'Загрузка...' }) {
  return (
    <div className="loader-screen">
      <div className="loader-spinner" />
      <p>{text}</p>
    </div>
  );
}
