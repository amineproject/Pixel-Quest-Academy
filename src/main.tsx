import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PixelErrorBoundary } from './components/PixelErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <PixelErrorBoundary scopeLabel="Pixel Quest Academy">
    <App />
  </PixelErrorBoundary>
);
