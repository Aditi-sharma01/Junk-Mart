
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Upload = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Waste Items</h1>
          <p className="text-lg text-gray-600">Help others find value in what you no longer need</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-eco-primary">Upload Interface Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This page will feature an intuitive upload interface where you can add photos, 
              descriptions, and categorize your waste items for the marketplace.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Upload;
