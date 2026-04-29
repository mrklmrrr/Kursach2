import React from 'react';
import './PageLayout.css';

/**
 * Compound Component: PageLayout
 *
 * Usage:
 * <PageLayout>
 *   <PageLayout.Header><AppHeader title="Кабинет врача" /></PageLayout.Header>
 *   <PageLayout.Content>...</PageLayout.Content>
 *   <PageLayout.Footer><BottomNav /></PageLayout.Footer>
 * </PageLayout>
 */
function PageLayout({ children }) {
  return <div className="page-layout">{children}</div>;
}

function Header({ children }) {
  return <>{children}</>;
}

function Content({ children }) {
  return (
    <main className="page-content">
      <div className="page-shell page-shell--flex-grow">{children}</div>
    </main>
  );
}

function Footer({ children }) {
  return <>{children}</>;
}

PageLayout.Header = Header;
PageLayout.Content = Content;
PageLayout.Footer = Footer;

export default PageLayout;
