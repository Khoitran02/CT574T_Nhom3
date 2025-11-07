import { FileText } from 'lucide-react';
import PostCard from './PostCard';
import EmptyState from '../UI/EmptyState';

const PostList = ({ posts, onEdit, onDelete }) => {
  if (posts.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <EmptyState 
          icon={FileText}
          message="Chưa có bài viết nào. Hãy tạo post đầu tiên!"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onEdit={() => onEdit(post)}
          onDelete={() => onDelete(post.id)}
        />
      ))}
    </div>
  );
};

export default PostList;
