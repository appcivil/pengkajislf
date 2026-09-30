import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Hide static index.html loading screen when React app mounts
const loader = document.getElementById('loading-screen');
if (loader) {
  loader.style.opacity = '0';
  setTimeout(() => {
    loader.style.display = 'none';
  }, 400);
}

const container = document.getElementById('root')!;
createRoot(container).render(<App />);
