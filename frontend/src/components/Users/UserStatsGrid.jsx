import { UserCheck, User, Edit } from 'lucide-react';
import StatCard from '../UI/StatCard';

const UserStatsGrid = ({ users, total }) => {
  const totalUsers = total || users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const dbStatus = users.length > 0 ? 'MongoDB' : 'N/A';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        icon={UserCheck}
        iconColor="text-green-600"
        value={totalUsers}
        label="Total Users"
      />
      <StatCard 
        icon={User}
        iconColor="text-blue-600"
        value={activeUsers}
        label="Active Users"
      />
      <StatCard 
        icon={Edit}
        iconColor="text-purple-600"
        value={dbStatus}
        label="Database Status"
      />
    </div>
  );
};

export default UserStatsGrid;
