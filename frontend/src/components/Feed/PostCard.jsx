import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle } from 'lucide-react';
import { commentsAPI, postsAPI } from '../../services/api';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

const PostCard = ({ post, currentUser }) => {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);

  // Fetch comments count ngay từ đầu
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

  const createCommentMutation = useMutation({
    mutationFn: commentsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: ({ postId, userId }) => postsAPI.like(postId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const comments = commentsData?.data?.data || [];
  const totalCommentsCount = countAllComments(comments);
  const isLiked = post.likedBy?.includes(currentUser?._id);
  const likesCount = post.likes || 0;

  const handleAddComment = (content, parentCommentId = null) => {
    if (currentUser && content.trim()) {
      createCommentMutation.mutate({
        content,
        author: currentUser.name,
        authorId: currentUser._id,
        postId: post.id,
        parentCommentId,
      });
    }
  };

  const handleLike = () => {
    if (currentUser) {
      likeMutation.mutate({ postId: post.id, userId: currentUser._id });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      {/* Post Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
          {post.author?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{post.author}</h3>
          <p className="text-xs sm:text-sm text-gray-500">
            {new Date(post.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 text-left">{post.content}</p>

      {/* Post Actions */}
      <div className="flex items-center gap-3 sm:gap-4 text-gray-500 border-t pt-3 sm:pt-4">
        <button 
          onClick={handleLike}
          disabled={likeMutation.isPending}
          className={`flex items-center gap-1 text-sm sm:text-base transition-colors ${
            isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span>Thích {likesCount > 0 && `(${likesCount})`}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 hover:text-blue-500 text-sm sm:text-base"
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Bình luận {totalCommentsCount > 0 && `(${totalCommentsCount})`}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 sm:mt-4 border-t pt-3 sm:pt-4">
          <CommentForm onSubmit={(content) => handleAddComment(content)} />
          <CommentList
            comments={comments}
            onReply={handleAddComment}
            currentUser={currentUser}
            postId={post.id}
          />
        </div>
      )}
    </div>
  );
};

export default PostCard;
