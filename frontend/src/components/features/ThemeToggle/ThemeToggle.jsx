import { useEffect, useState } from 'react';
import './ThemeToggle.css';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (dark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <label className="theme-switch">
      <input type="checkbox" checked={dark} onChange={() => setDark(!dark)} />
      <span className="slider round" />
    </label>
  );
}
