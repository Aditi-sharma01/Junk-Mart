
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Listings = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Listings</h1>
          <p className="text-lg text-gray-600">Manage your uploaded waste items</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-eco-primary">Your Listings Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Track the status of your uploaded items, manage inquiries, 
              and monitor your contribution to the circular economy.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Listings;
