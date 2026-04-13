import BottomNav from '../BottomNav/BottomNav';
import './PageLayout.css';

export default function PageLayout({ header, children, showNav = true }) {
  return (
    <div className="page-layout">
      {header}
      <main className="page-content">{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
}
