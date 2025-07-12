import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGoogleDriveImageSrc } from '../lib/utils';
import { useAuth } from '../lib/auth';

interface WasteItem {
  id: number;
  user_id: number;
  description: string;
  image_url: string;
  verified?: boolean;
  predicted_category?: string;
  username?: string; // Added username to the interface
}

const Listings = () => {
  const [items, setItems] = useState<WasteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/listings?user_id=${user.id}`);
        if (!res.ok) throw new Error('Failed to fetch listings');
        const data = await res.json();
        setItems(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching listings');
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [user]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Listings</h1>
          <p className="text-lg text-gray-600">Manage your uploaded waste items</p>
        </div>
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500">No waste items found.</p>
        ) : (
          <div className="grid gap-6">
            {items.map(item => {
              const convertedUrl = getGoogleDriveImageSrc(item.image_url);
              console.log('Image URL:', item.image_url, 'Converted:', convertedUrl);
              return (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle>Waste Item #{item.id}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <img
                        src={convertedUrl}
                        alt={item.description}
                        className="w-32 h-32 object-cover rounded border"
                        onError={e => (e.currentTarget.src = 'https://via.placeholder.com/128?text=No+Image')}
                      />
                      <div className="flex-1">
                        <p className="font-semibold">Description:</p>
                        <p className="mb-2">{item.description}</p>
                        <p className="text-sm text-gray-500">Username: {item.username}</p>
                        <p className="text-sm mt-2">
                          Verified: {item.verified ? (
                            <span style={{color: 'green'}}>✔️</span>
                          ) : (
                            <span style={{color: 'red'}}>❌</span>
                          )}
                          {!item.verified && item.predicted_category && (
                            <span className="text-gray-400 ml-2">(Model prediction: {item.predicted_category})</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Listings;
