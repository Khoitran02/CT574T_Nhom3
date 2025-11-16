import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Reply, Heart } from 'lucide-react';
import { commentsAPI } from '../../services/api';
import CommentForm from './CommentForm';

const CommentItem = ({ comment, onReply, currentUser, level = 0, postId }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const queryClient = useQueryClient();

  const likeCommentMutation = useMutation({
    mutationFn: ({ commentId, userId }) => commentsAPI.like(commentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const handleReply = (content) => {
    onReply(content, comment._id);
    setShowReplyForm(false);
  };

  const handleLikeComment = () => {
    if (currentUser) {
      likeCommentMutation.mutate({
        commentId: comment._id,
        userId: currentUser._id,
      });
    }
  };

  // Đóng reply form khi nhấn ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showReplyForm) {
        setShowReplyForm(false);
      }
    };

    if (showReplyForm) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showReplyForm]);

  const isLiked = comment.likedBy?.includes(currentUser?._id);

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {comment.author?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-gray-900">
                {comment.author}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <p className="text-gray-700 text-sm">{comment.content}</p>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={handleLikeComment}
                className={`text-xs flex items-center gap-1 ${
                  isLiked ? 'text-red-600' : 'text-gray-600'
                } hover:text-red-600`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                {comment.likes || 0}
              </button>
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Reply className="w-3 h-3" />
                Trả lời
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReplyForm && (
        <div className="mt-2 ml-8">
          <CommentForm
            onSubmit={handleReply}
            placeholder={`Trả lời ${comment.author}... (Nhấn ESC để hủy)`}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              onReply={onReply}
              currentUser={currentUser}
              level={level + 1}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
