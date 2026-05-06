import { useParams } from 'react-router-dom';

export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Market Detail: {id}
      </h1>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Market detail page will be implemented in Phase 3.
        </p>
      </div>
    </div>
  );
}
