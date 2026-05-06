import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default function HomePage() {
  const [health, setHealth] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        setHealth(response.data.status);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to server');
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Polymarket Markets
      </h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Server Status</h2>
        {loading && <p className="text-gray-600">Checking server...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        {health && <p className="text-green-600">Server is {health}</p>}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          Phase 1: Basic Setup
        </h2>
        <p className="text-blue-800">
          Frontend and backend are connected. Market data display coming in Phase 2.
        </p>
      </div>
    </div>
  );
}
