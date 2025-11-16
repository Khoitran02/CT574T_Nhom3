import { Heart, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { commentsAPI } from '../../services/api';

const PostCard = ({ post, onEdit, onDelete }) => {
  // Fetch comments để đếm
  const { data: commentsData } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => commentsAPI.getByPostId(post.id),
  });

  // Tính tổng số comments bao gồm replies
  const countAllComments = (comments) => {
    let total = 0;
    const countRecursive = (commentList) => {
      commentList.forEach(comment => {
        total++;
        if (comment.replies && comment.replies.length > 0) {
          countRecursive(comment.replies);
        }
      });
    };
    countRecursive(comments);
    return total;
  };

  const comments = commentsData?.data?.data || [];
  const totalCommentsCount = countAllComments(comments);

  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <p className="text-sm text-gray-500">
            by {post.author} • {new Date(post.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            post.isPublished 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {post.isPublished ? 'Published' : 'Draft'}
          </span>
          <button onClick={onEdit} className="text-blue-600 hover:text-blue-800">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="text-red-600 hover:text-red-800">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-3 text-left">{post.content}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-gray-500">
            <Heart className="w-4 h-4 mr-1" />
            <span>{post.likes || 0}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <MessageSquare className="w-4 h-4 mr-1" />
            <span>{totalCommentsCount} comments</span>
          </div>
        </div>
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
