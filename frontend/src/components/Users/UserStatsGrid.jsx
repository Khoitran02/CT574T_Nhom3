import { UserCheck, Users, ShieldCheck } from 'lucide-react';
import StatCard from '../UI/StatCard';

const UserStatsGrid = ({ users, total, stats }) => {
  const totalUsers = stats?.total || total || users.length;
  const regularUsers = stats?.regularUsers || users.filter(u => u.role === 'user').length;
  const adminCount = stats?.admins || users.filter(u => u.role === 'admin').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        icon={UserCheck}
        iconColor="text-green-600"
        value={totalUsers}
        label="Total Users"
      />
      <StatCard 
        icon={Users}
        iconColor="text-purple-600"
        value={regularUsers}
        label="Regular Users"
      />
      <StatCard 
        icon={ShieldCheck}
        iconColor="text-orange-600"
        value={adminCount}
        label="Admins"
      />
    </div>
  );
};

export default UserStatsGrid;
