import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastContainer, useToast } from './components/ui/Toast';
import { useRealtimeUpdates } from './hooks/useRealtimeUpdates';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MarketDetailPage from './pages/MarketDetailPage';

function App() {
  const { toasts, removeToast } = useToast();

  // Enable real-time price updates via SSE
  useRealtimeUpdates();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/market/:id" element={<MarketDetailPage />} />
          </Route>
        </Routes>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
