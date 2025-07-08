
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

const WelcomeSection = () => {
  return (
    <Card className="bg-gradient-to-r from-eco-primary to-eco-secondary text-white overflow-hidden">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Turn Your Waste into Worth! 🌱
            </h1>
            <p className="text-lg opacity-90 mb-6 max-w-2xl">
              Join our sustainable community where one person's trash becomes another's treasure. 
              Upload your waste items, discover creative DIY projects, and help build a greener future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="secondary" size="lg" className="font-semibold">
                <Link to="/upload" className="flex items-center space-x-2">
                  <Upload size={20} />
                  <span>Upload Waste</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold">
                <Link to="/marketplace" className="flex items-center space-x-2">
                  <Store size={20} />
                  <span>Browse Marketplace</span>
                </Link>
              </Button>
            </div>
          </div>
          <div className="text-6xl lg:text-8xl opacity-20">
            ♻️
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeSection;
