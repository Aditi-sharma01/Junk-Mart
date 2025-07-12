
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WasteItem {
  id: number;
  user_id: number;
  description: string;
  image_url: string;
  category: string;
  amount_kg: number;
  verified?: boolean;
  predicted_category?: string;
}

const categoryImages: Record<string, string> = {
  Plastic: '/plastic.jpeg',
  Metal: '/iron.jpeg',
  Paper: '/paper.jpeg',
  Glass: '/glass.jpeg',
  'E-Waste': '/circuit.jpeg',
  Fabric: '/fabric.jpeg',
  Organic: '/organic.jpeg',
};

const TOKEN_PRICE = 10; // ₹10 per token

const Marketplace = () => {
  const [items, setItems] = useState<WasteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://127.0.0.1:8000/api/marketplace-listings');
        if (!res.ok) throw new Error('Failed to fetch marketplace listings');
        const data = await res.json();
        setItems(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching marketplace listings');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Group items by category
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, WasteItem[]>);
  const categories = Object.keys(grouped);

  // For modal/details
  const [showDetails, setShowDetails] = useState(false);
  const [detailsCategory, setDetailsCategory] = useState<string | null>(null);

  const handleCategoryClick = (cat: string) => {
    setDetailsCategory(cat);
    setShowDetails(true);
  };
  const closeDetails = () => setShowDetails(false);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Waste Marketplace</h1>
          <p className="text-lg text-gray-600">Discover valuable items from community members</p>
        </div>
        {loading ? (
          <div className="text-center py-16">Loading...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">No waste items found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map(cat => {
              const catItems = grouped[cat];
              const totalAmount = catItems.reduce((sum, i) => sum + (i.amount_kg || 0), 0);
              const userCount = new Set(catItems.map(i => i.user_id)).size;
              // Price per kg in tokens (rounded up)
              const pricePerKgTokens = Math.ceil(TOKEN_PRICE / TOKEN_PRICE); // 1 token per kg (for demo, can be dynamic)
              // Use the first item's image_url as the thumbnail, fallback to category image or placeholder
              const thumbnailUrl = catItems[0]?.image_url || categoryImages[cat] || '/placeholder.svg';
              return (
                <div
                  key={cat}
                  className="bg-white rounded-2xl shadow-md p-5 flex flex-col items-center border border-green-100 cursor-pointer hover:shadow-lg transition"
                  onClick={() => handleCategoryClick(cat)}
                >
                  <img
                    src={thumbnailUrl}
                    alt={cat}
                    className="w-32 h-32 object-cover rounded mb-4 border bg-white"
                    onError={e => (e.currentTarget.src = '/placeholder.svg')}
                  />
                  <div className="w-full flex flex-col items-center mb-2">
                    <span className="text-lg font-semibold text-gray-900 text-center">{cat}</span>
                    <span className="mt-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 mb-1">{cat}</span>
                  </div>
                  <div className="w-full flex flex-col items-center mt-auto">
                    <span className="text-green-700 font-bold text-lg mb-2">{totalAmount.toFixed(2)} kg</span>
                    <span className="text-amber-600 font-semibold text-sm mb-1">Price: {pricePerKgTokens} token/kg</span>
                    <span className="text-gray-500 text-sm">{userCount} user{userCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Modal/Section */}
        {showDetails && detailsCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full text-center relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={closeDetails}>&times;</button>
              <h2 className="text-2xl font-bold mb-2">{detailsCategory} Details</h2>
              <img
                src={categoryImages[detailsCategory] || '/placeholder.svg'}
                alt={detailsCategory}
                className="w-32 h-32 object-cover rounded mx-auto mb-4 border bg-white"
                onError={e => (e.currentTarget.src = '/placeholder.svg')}
              />
              <p className="mb-2">Total Amount: <b>{grouped[detailsCategory].reduce((sum, i) => sum + (i.amount_kg || 0), 0).toFixed(2)} kg</b></p>
              <p className="mb-2">Price: <b>1 token/kg</b> (1 token = ₹10)</p>
              <p className="mb-2">Number of Users: <b>{new Set(grouped[detailsCategory].map(i => i.user_id)).size}</b></p>
              <div className="mt-4 text-left max-h-60 overflow-y-auto">
                <h3 className="font-semibold mb-2">Items:</h3>
                <ul className="space-y-2">
                  {grouped[detailsCategory].map(item => (
                    <li key={item.id} className="border rounded p-2 flex flex-col sm:flex-row sm:items-center gap-2">
                      <img
                        src={item.image_url || '/placeholder.svg'}
                        alt={item.description}
                        className="w-16 h-16 object-cover rounded border bg-white"
                        onError={e => (e.currentTarget.src = '/placeholder.svg')}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{item.description}</div>
                        <div className="text-xs text-amber-600">Price: 1 token/kg</div>
                        <div className="text-xs text-gray-400">Username: {item.username}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Marketplace;
