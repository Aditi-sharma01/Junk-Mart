
import { TrendingUp, Recycle, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardStats = () => {
  const stats = [
    {
      title: 'Items Uploaded',
      value: '127',
      icon: TrendingUp,
      change: '+12% from last month',
      color: 'text-eco-primary'
    },
    {
      title: 'Waste Recycled',
      value: '2.3 tons',
      icon: Recycle,
      change: '+8% from last month',
      color: 'text-eco-secondary'
    },
    {
      title: 'Earnings',
      value: '$1,247',
      icon: DollarSign,
      change: '+15% from last month',
      color: 'text-green-600'
    },
    {
      title: 'Community Impact',
      value: '89 users',
      icon: Users,
      change: '+23% from last month',
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-eco-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-green-600 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
