import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Reply, Heart, MoreHorizontal, Pencil, Trash2, Maximize2 } from 'lucide-react';
import { commentsAPI } from '../../services/api';
import { getResourceUrl } from '../../utils/url';
import CommentForm from './CommentForm';
import ImageModal from '../UI/ImageModal';

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now - postDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Dưới 1 phút
  if (diffMins < 1) return 'Vừa xong';
  
  // Dưới 1 giờ
  if (diffMins < 60) return `${diffMins} phút`;
  
  // Dưới 24 giờ
  if (diffHours < 24) return `${diffHours} giờ`;
  
  // Hôm qua
  if (diffDays === 1) {
    const time = postDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `Hôm qua, lúc ${time}`;
  }
  
  // Dưới 7 ngày
  if (diffDays < 7) return `${diffDays} ngày`;
  
  // Từ 7 ngày trở lên
  const day = postDate.getDate();
  const month = postDate.toLocaleDateString('vi-VN', { month: 'long' });
  const time = postDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${month}, lúc ${time}`;
};

// Helper function to render content with clickable mentions
const renderContentWithMentions = (content, mentions = [], navigate) => {
  if (!mentions || mentions.length === 0) return content;

  const parts = [];
  let lastIndex = 0;

  const sortedMentions = [...mentions].sort((a, b) => a.position - b.position);

  sortedMentions.forEach((mention) => {
    const mentionText = `@${mention.username}`;
    const index = content.indexOf(mentionText, lastIndex);
    
    if (index !== -1) {
      if (index > lastIndex) {
        parts.push(content.substring(lastIndex, index));
      }
      
      parts.push(
        <span
          key={`mention-${mention.position}`}
          className="text-blue-600 font-medium hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (navigate && mention.userId) {
              navigate(`/profile/${mention.userId}`);
            }
          }}
        >
          {mentionText}
        </span>
      );
      
      lastIndex = index + mentionText.length;
    }
  });

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

const CommentItem = ({ comment, onReply, currentUser, level = 0, postId }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const MAX_COMMENT_LENGTH = 200;
  
  // Check if current user is the author
  const isAuthor = currentUser && (
    comment.authorId === currentUser._id || 
    comment.authorId?._id === currentUser._id ||
    comment.authorId?.toString() === currentUser._id
  );

  const likeCommentMutation = useMutation({
    mutationFn: ({ commentId, userId }) => commentsAPI.like(commentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, formData }) => commentsAPI.update(commentId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setShowEditForm(false);
    },
  });

  const handleReply = (content) => {
    onReply(content, comment._id);
    setShowReplyForm(false);
  };

  const handleEdit = () => {
    if (!editContent.trim()) return;
    
    const formData = new FormData();
    formData.append('content', editContent);
    
    updateCommentMutation.mutate({ 
      commentId: comment._id, 
      formData 
    });
  };

  const handleLikeComment = () => {
    if (currentUser) {
      likeCommentMutation.mutate({
        commentId: comment._id,
        userId: currentUser._id,
      });
    }
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const handleNavigateToProfile = (e) => {
    e.stopPropagation();
    const authorId = typeof comment.authorId === 'object' ? comment.authorId._id : comment.authorId;
    if (authorId) {
      navigate(`/profile/${authorId}`);
    }
  };

  // Đóng reply form và menu khi nhấn ESC hoặc click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showReplyForm) setShowReplyForm(false);
        if (showEditForm) {
          setShowEditForm(false);
          setEditContent(comment.content);
        }
        if (showMenu) setShowMenu(false);
        if (showImageModal) setShowImageModal(false);
      }
    };

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showReplyForm || showEditForm || showMenu || showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReplyForm, showEditForm, showMenu, showImageModal, comment.content]);

  const isLiked = comment.likedBy?.includes(currentUser?._id);
  
  // Check if comment needs truncation
  const contentLength = comment.content?.length || 0;
  const shouldTruncate = contentLength > MAX_COMMENT_LENGTH;
  const displayContent = shouldTruncate && !isExpanded 
    ? comment.content.substring(0, MAX_COMMENT_LENGTH) + '...' 
    : comment.content;

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-3 relative">
        <div className="flex items-start gap-2">
          {comment.authorAvatar ? (
            <img 
              src={getResourceUrl(comment.authorAvatar)}
              alt={comment.author}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleNavigateToProfile}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ display: comment.authorAvatar ? 'none' : 'flex' }}
            onClick={handleNavigateToProfile}
          >
            {comment.author?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0 text-left pr-8">
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="font-semibold text-sm text-gray-900 cursor-pointer hover:underline"
                onClick={handleNavigateToProfile}
              >
                {comment.author}
              </span>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.createdAt)}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-gray-400 italic">
                  (đã chỉnh sửa)
                </span>
              )}
            </div>
            {showEditForm ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows="3"
                  placeholder="Chỉnh sửa bình luận..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleEdit}
                    disabled={!editContent.trim() || updateCommentMutation.isPending}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {updateCommentMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditContent(comment.content);
                    }}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-700 text-sm text-left">
                <p className="whitespace-pre-wrap break-words">
                  {renderContentWithMentions(displayContent, comment.mentions, navigate)}
                  {shouldTruncate && (
                    <span>
                      {' '}
                      <span
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs cursor-pointer transition-colors"
                      >
                        {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
                      </span>
                    </span>
                  )}
                </p>
              </div>
            )}
            
            {/* Comment Images */}
            {comment.images && comment.images.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2 max-w-xs">
                {comment.images.map((image, index) => (
                  <div key={index} className="relative group cursor-pointer">
                    <img
                      src={getResourceUrl(image)}
                      alt={`Comment image ${index + 1}`}
                      className="w-full h-24 sm:h-28 object-cover rounded border hover:opacity-90 transition-opacity"
                      onClick={() => handleImageClick(index)}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center"
                      onClick={() => handleImageClick(index)}
                    >
                      <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
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
        
        {/* Menu chỉnh sửa - position absolute */}
        {isAuthor && (
          <div className="absolute top-3 right-3" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors font-medium"
            >
              •••
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => {
                    setShowEditForm(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => {
                    // TODO: Add delete functionality
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showReplyForm && (
        <div className="mt-2 ml-8">
          <CommentForm
            onSubmit={handleReply}
            placeholder={`Trả lời ${comment.author}... (Nhấn ESC để hủy)`}
            currentUser={currentUser}
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

      {/* Image Modal */}
      {showImageModal && comment.images && (
        <ImageModal
          images={comment.images.map(img => getResourceUrl(img))}
          initialIndex={selectedImageIndex}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
};

export default CommentItem;
