// components/Social/UserStats.jsx
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck } from 'lucide-react';
import { getUserStats } from '../../services/api';

const UserStats = ({ userId }) => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['userStats', userId],
    queryFn: () => getUserStats(userId),
    enabled: !!userId
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="animate-pulse flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>Loading...</span>
        </div>
        <div className="animate-pulse flex items-center gap-1">
          <UserCheck className="w-4 h-4" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors">
        <Users className="w-4 h-4" />
        <span className="font-medium">{stats.data?.followersCount || 0}</span>
        <span>Followers</span>
      </div>
      
      <div className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors">
        <UserCheck className="w-4 h-4" />
        <span className="font-medium">{stats.data?.followingCount || 0}</span>
        <span>Following</span>
      </div>
    </div>
  );
};

export default UserStats;