import BottomNav from '../BottomNav/BottomNav';
import './PageLayout.css';

export default function PageLayout({ header, children, showNav = true }) {
  return (
    <div className="page-layout">
      {header}
      <main className="page-content">
        <div className="page-shell page-shell--flex-grow">{children}</div>
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
