
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Marketplace = () => {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Waste Marketplace</h1>
          <p className="text-lg text-gray-600">Discover valuable items from community members</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-eco-primary">Marketplace Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Browse through a curated collection of waste items, filter by category, 
              and find sustainable solutions for your projects.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Marketplace;
