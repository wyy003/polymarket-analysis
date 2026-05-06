import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MarketDetailPage from './pages/MarketDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/market/:id" element={<MarketDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
