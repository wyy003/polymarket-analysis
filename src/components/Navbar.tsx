import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Polymarket Analysis
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Markets
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
