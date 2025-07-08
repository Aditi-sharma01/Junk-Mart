
import Layout from '@/components/Layout';
import WelcomeSection from '@/components/WelcomeSection';
import DashboardStats from '@/components/DashboardStats';

const Index = () => {
  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <WelcomeSection />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Dashboard</h2>
          <DashboardStats />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
