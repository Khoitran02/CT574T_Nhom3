import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { commentsAPI, postsAPI } from '../../services/api';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

// Helper function to render content with clickable mentions
const renderContentWithMentions = (content, mentions = []) => {
  if (!mentions || mentions.length === 0) return content;

  const parts = [];
  let lastIndex = 0;

  // Sort mentions by position
  const sortedMentions = [...mentions].sort((a, b) => a.position - b.position);

  sortedMentions.forEach((mention) => {
    const mentionText = `@${mention.username}`;
    const index = content.indexOf(mentionText, lastIndex);
    
    if (index !== -1) {
      // Add text before mention
      if (index > lastIndex) {
        parts.push(content.substring(lastIndex, index));
      }
      
      // Add clickable mention
      parts.push(
        <span
          key={`mention-${mention.position}`}
          className="text-blue-600 font-medium hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (mention.userId) {
              window.location.href = `/profile/${mention.userId}`;
            }
          }}
        >
          {mentionText}
        </span>
      );
      
      lastIndex = index + mentionText.length;
    }
  });

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

const PostCard = ({ post, currentUser }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
      // Invalidate all query keys that might contain posts
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    },
  });

  const comments = commentsData?.data?.data || [];
  const totalCommentsCount = countAllComments(comments);
  const isLiked = post.likedBy?.includes(currentUser?._id);
  const likesCount = post.likes || 0;

  const handleAddComment = (contentOrFormData, parentCommentId = null) => {
    if (!currentUser) return;
    
    // Kiểm tra xem có phải FormData không
    if (contentOrFormData instanceof FormData) {
      contentOrFormData.append('author', currentUser.name);
      contentOrFormData.append('authorId', currentUser._id);
      contentOrFormData.append('postId', post.id);
      if (parentCommentId) {
        contentOrFormData.append('parentCommentId', parentCommentId);
      }
      createCommentMutation.mutate(contentOrFormData);
    } else if (typeof contentOrFormData === 'string' && contentOrFormData.trim()) {
      // Content đơn giản
      createCommentMutation.mutate({
        content: contentOrFormData,
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
          <h3 
            className="font-semibold text-gray-900 text-sm sm:text-base hover:text-blue-600 cursor-pointer"
            onClick={() => {
              const userId = post.authorId || post.userId;
              if (userId && userId !== currentUser?._id) {
                navigate(`/profile/${userId}`);
              }
            }}
          >
            {post.author}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500">
            {new Date(post.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 text-left whitespace-pre-wrap">
        {renderContentWithMentions(post.content, post.mentions)}
      </p>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className={`mb-3 sm:mb-4 grid gap-2 ${
          post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
        }`}>
          {post.images.map((image, index) => (
            <img
              key={index}
              src={`http://localhost:3001${image}`}
              alt={`Post image ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg border border-gray-200"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ))}
        </div>
      )}

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
          <CommentForm 
            onSubmit={(content) => handleAddComment(content)} 
            currentUser={currentUser}
          />
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
