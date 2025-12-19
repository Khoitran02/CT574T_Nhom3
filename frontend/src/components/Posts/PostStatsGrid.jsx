import { FileText, MessageSquare } from 'lucide-react';
import StatCard from '../UI/StatCard';

const PostStatsGrid = ({ total, totalComments }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatCard 
        icon={FileText}
        iconColor="text-blue-600"
        value={total || 0}
        label="Total Posts"
      />
      <StatCard 
        icon={MessageSquare}
        iconColor="text-green-600"
        value={totalComments || 0}
        label="Total Comments"
      />
    </div>
  );
};

export default PostStatsGrid;
