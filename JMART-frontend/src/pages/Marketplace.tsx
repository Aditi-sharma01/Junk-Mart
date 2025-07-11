
import React, { useState } from 'react';
import Layout from '@/components/Layout';

const categories = [
  'All', 'Plastic', 'Iron', 'Paper', 'Glass', 'E-Waste', 'Fabric', 'Organic'
];

const mockItems = [
  {
    id: 1,
    name: 'Used Plastic Bottles',
    category: 'Plastic',
    location: 'Delhi, India',
    price: '₹20/kg',
    image: 'https://via.placeholder.com/128?text=Plastic',
  },
  {
    id: 2,
    name: 'Old Iron Rods',
    category: 'Iron',
    location: 'Mumbai, India',
    price: '₹15/kg',
    image: 'https://via.placeholder.com/128?text=Iron',
  },
  {
    id: 3,
    name: 'Waste Paper Sheets',
    category: 'Paper',
    location: 'Bangalore, India',
    price: '₹10/kg',
    image: 'https://via.placeholder.com/128?text=Paper',
  },
  {
    id: 4,
    name: 'Broken Glass Jars',
    category: 'Glass',
    location: 'Chennai, India',
    price: '₹12/kg',
    image: 'https://via.placeholder.com/128?text=Glass',
  },
  {
    id: 5,
    name: 'E-Waste Circuit Boards',
    category: 'E-Waste',
    location: 'Hyderabad, India',
    price: '₹50/kg',
    image: 'https://via.placeholder.com/128?text=E-Waste',
  },
  {
    id: 6,
    name: 'Old Fabric Scraps',
    category: 'Fabric',
    location: 'Pune, India',
    price: '₹8/kg',
    image: 'https://via.placeholder.com/128?text=Fabric',
  },
  {
    id: 7,
    name: 'Organic Compost',
    category: 'Organic',
    location: 'Kolkata, India',
    price: '₹5/kg',
    image: 'https://via.placeholder.com/128?text=Organic',
  },
];

const Marketplace = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredItems = selectedCategory === 'All'
    ? mockItems
    : mockItems.filter(item => item.category === selectedCategory);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Waste Marketplace</h1>
          <p className="text-lg text-gray-600">Discover valuable items from community members</p>
        </div>
        {/* Category Filter Bar */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              className={`px-5 py-2 rounded-full border transition font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-300 hover:bg-green-50'}`}
              style={{ minWidth: 90 }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Marketplace Cards or Empty State */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">No waste items found.</h2>
            <p className="text-gray-500">Try selecting another category or come back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-md p-5 flex flex-col items-center border border-green-100"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-32 h-32 object-cover rounded mb-4 border"
                  onError={e => (e.currentTarget.src = 'https://via.placeholder.com/128?text=No+Image')}
                />
                <div className="w-full flex flex-col items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900 text-center">{item.name}</span>
                  <span className="mt-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 mb-1">{item.category}</span>
                  <span className="text-sm text-gray-500">{item.location}</span>
                </div>
                <div className="w-full flex flex-col items-center mt-auto">
                  <span className="text-green-700 font-bold text-lg mb-2">{item.price}</span>
                  <button className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-green-700 transition">Buy Now</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Marketplace;
