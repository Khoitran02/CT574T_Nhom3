import { FileText, MessageSquare, Heart } from 'lucide-react';
import StatCard from '../UI/StatCard';

const PostStatsGrid = ({ posts, total, totalComments }) => {
  const totalPosts = total || posts.length;
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        icon={FileText}
        iconColor="text-blue-600"
        value={totalPosts}
        label="Total Posts"
      />
      <StatCard 
        icon={Heart}
        iconColor="text-red-600"
        value={totalLikes}
        label="Total Likes"
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
