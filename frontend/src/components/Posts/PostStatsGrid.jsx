import { FileText, ThumbsUp, MessageSquare, Heart, Edit } from 'lucide-react';
import StatCard from '../UI/StatCard';

const PostStatsGrid = ({ posts, total }) => {
  const totalPosts = total || posts.length;
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const publishedPosts = posts.filter(p => p.isPublished).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        value={0}
        label="Comments"
      />
      <StatCard 
        icon={Edit}
        iconColor="text-purple-600"
        value={publishedPosts}
        label="Published"
      />
    </div>
  );
};

export default PostStatsGrid;
