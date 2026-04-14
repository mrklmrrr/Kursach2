import BottomNav from '../BottomNav/BottomNav';
import './PageLayout.css';

export default function PageLayout({ header, children, showNav = true, withEdgeSpacing = true }) {
  return (
    <div className="page-layout">
      {header}
      <main className="page-content">
        <div className="sidebar-container">
          <div className={withEdgeSpacing ? 'page-edge-spacing' : ''}>
            {children}
          </div>
        </div>
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
