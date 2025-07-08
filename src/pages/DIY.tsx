
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DIY = () => {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">DIY Ideas & Projects</h1>
          <p className="text-lg text-gray-600">Transform waste into wonderful creations</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-eco-primary">Creative Inspiration Hub</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Explore creative projects, step-by-step tutorials, and innovative ways 
              to repurpose waste materials into beautiful and functional items.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DIY;
