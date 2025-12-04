import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Maximize2, MoreHorizontal, Pencil, Trash2, Globe, Users, Lock } from 'lucide-react';
import { commentsAPI, postsAPI } from '../../services/api';
import { getResourceUrl } from '../../utils/url';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import ImageModal from '../UI/ImageModal';
import EditPostModal from './EditPostModal';
import LikesModal from './LikesModal';

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now - postDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút`;
  if (diffHours < 24) return `${diffHours} giờ`;
  
  if (diffDays === 1) {
    const time = postDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `Hôm qua, lúc ${time}`;
  }
  
  if (diffDays < 7) return `${diffDays} ngày`;
  
  const day = postDate.getDate();
  const month = postDate.toLocaleDateString('vi-VN', { month: 'long' });
  const time = postDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${month}, lúc ${time}`;
};

// Helper function to render content with clickable mentions
const renderContentWithMentions = (content, mentions = []) => {
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

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

const PostCard = ({ post, currentUser }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const postCardRef = useRef(null);
  const menuRef = useRef(null);
  const [showComments, setShowComments] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  
  const [localLikedBy, setLocalLikedBy] = useState(post.likedBy || []);
  const [localLikes, setLocalLikes] = useState(post.likes || 0);
  
  const isAuthor = currentUser && (
    post.userId === currentUser._id || 
    post.authorId === currentUser._id
  );

  useEffect(() => {
    setLocalLikedBy(post.likedBy || []);
    setLocalLikes(post.likes || 0);
  }, [post.likedBy, post.likes]);
  
  const MAX_CONTENT_LENGTH = 300;

  const { data: commentsData } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => commentsAPI.getByPostId(post.id),
  });

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
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ postId, formData }) => postsAPI.update(postId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setShowEditModal(false);
      setShowMenu(false);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => postsAPI.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const comments = commentsData?.data?.data || [];
  const totalCommentsCount = countAllComments(comments);
  
  // Check if current user liked - handle both object and string formats
  const isLiked = localLikedBy?.some(item => {
    if (typeof item === 'object' && item._id) {
      return item._id === currentUser?._id;
    }
    return item === currentUser?._id;
  }) || false;
  
  const likesCount = localLikes;

  const handleAddComment = (contentOrFormData, parentCommentId = null) => {
    if (!currentUser) return;
    
    if (contentOrFormData instanceof FormData) {
      contentOrFormData.append('author', currentUser.name);
      contentOrFormData.append('authorId', currentUser._id);
      contentOrFormData.append('postId', post.id);
      if (parentCommentId) {
        contentOrFormData.append('parentCommentId', parentCommentId);
      }
      createCommentMutation.mutate(contentOrFormData);
    } else if (typeof contentOrFormData === 'string' && contentOrFormData.trim()) {
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
      // Check if currently liked
      const isCurrentlyLiked = localLikedBy.some(item => {
        if (typeof item === 'object' && item._id) {
          return item._id === currentUser._id;
        }
        return item === currentUser._id;
      });
      
      if (isCurrentlyLiked) {
        // Remove like - filter out current user
        setLocalLikedBy(localLikedBy.filter(item => {
          if (typeof item === 'object' && item._id) {
            return item._id !== currentUser._id;
          }
          return item !== currentUser._id;
        }));
        setLocalLikes(Math.max(0, localLikes - 1));
      } else {
        // Add like - add current user object
        setLocalLikedBy([...localLikedBy, {
          _id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar
        }]);
        setLocalLikes(localLikes + 1);
      }
      
      likeMutation.mutate({ postId: post.id, userId: currentUser._id });
    }
  };

  const handleEditPost = (formData) => {
    updatePostMutation.mutate({ 
      postId: post.id, 
      formData 
    });
  };

  const handleDeletePost = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      deletePostMutation.mutate(post.id);
    }
    setShowMenu(false);
  };

  const handleChangeVisibility = (visibility) => {
    const formData = new FormData();
    formData.append('content', post.content);
    formData.append('visibility', visibility);
    formData.append('mentions', JSON.stringify(post.mentions || []));
    formData.append('emojis', JSON.stringify(post.emojis || []));
    formData.append('existingImages', JSON.stringify(post.images || []));
    
    updatePostMutation.mutate({ 
      postId: post.id, 
      formData 
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showMenu) {
        setShowMenu(false);
      }
    };

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const imageUrls = post.images?.map(img => getResourceUrl(img)) || [];
  const contentLength = post.content?.length || 0;
  const shouldTruncate = contentLength > MAX_CONTENT_LENGTH;
  const displayContent = shouldTruncate && !isExpanded 
    ? post.content.substring(0, MAX_CONTENT_LENGTH) + '...' 
    : post.content;

  const getVisibilityIcon = () => {
    switch(post.visibility) {
      case 'private': return <Lock className="w-3 h-3" />;
      case 'followers': return <Users className="w-3 h-3" />;
      default: return <Globe className="w-3 h-3" />;
    }
  };

  return (
    <div ref={postCardRef} className="bg-white rounded-lg shadow p-4 sm:p-6 relative">
      {/* Post Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        {post.authorAvatar ? (
          <img 
            src={getResourceUrl(post.authorAvatar)}
            alt={post.author}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base"
          style={{ display: post.authorAvatar ? 'none' : 'flex' }}
        >
          {post.author?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="text-left flex-1">
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
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm text-gray-500">
              {formatTimeAgo(post.createdAt)}
            </p>
            {post.visibility && (
              <span className="text-gray-400" title={post.visibility === 'private' ? 'Chỉ mình tôi' : post.visibility === 'followers' ? 'Người theo dõi' : 'Công khai'}>
                {getVisibilityIcon()}
              </span>
            )}
            {post.isEdited && (
              <span className="text-xs text-gray-400 italic">(đã chỉnh sửa)</span>
            )}
          </div>
        </div>
      </div>

      {/* Menu quản lý bài đăng */}
      {isAuthor && (
        <div className="absolute top-4 right-4" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors font-medium"
          >
            •••
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 min-w-[180px]">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b">
                Quyền riêng tư
              </div>
              <button
                onClick={() => {
                  handleChangeVisibility('public');
                  setShowMenu(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-3 transition-colors ${post.visibility === 'public' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
              >
                <Globe className="w-4 h-4" />
                Công khai
              </button>
              <button
                onClick={() => {
                  handleChangeVisibility('followers');
                  setShowMenu(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-3 transition-colors ${post.visibility === 'followers' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
              >
                <Users className="w-4 h-4" />
                Người theo dõi
              </button>
              <button
                onClick={() => {
                  handleChangeVisibility('private');
                  setShowMenu(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-3 transition-colors ${post.visibility === 'private' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
              >
                <Lock className="w-4 h-4" />
                Chỉ mình tôi
              </button>
              
              <div className="border-t my-1"></div>
              
              <button
                onClick={() => {
                  setShowEditModal(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Chỉnh sửa bài viết
              </button>
              <button
                onClick={handleDeletePost}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Xóa bài viết
              </button>
            </div>
          )}
        </div>
      )}

      {/* Post Content */}
      <div className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 text-left">
        <p className="whitespace-pre-wrap inline">
          {renderContentWithMentions(displayContent, post.mentions)}
          {shouldTruncate && (
            <span
              onClick={() => {
                if (isExpanded && postCardRef.current) {
                  setTimeout(() => {
                    postCardRef.current.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center',
                      inline: 'nearest'
                    });
                  }, 0);
                }
                setIsExpanded(!isExpanded);
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold ml-1 cursor-pointer transition-colors inline"
            >
              {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
            </span>
          )}
        </p>
      </div>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {post.images.slice(0, 6).map((image, index) => (
              <div key={index} className="relative group cursor-pointer" onClick={() => handleImageClick(index)}>
                <img
                  src={getResourceUrl(image)}
                  alt={`Post image ${index + 1}`}
                  className="w-full max-h-96 object-contain rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                  <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {index === 5 && post.images.length > 6 && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">+{post.images.length - 6}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Like and Comment Counts */}
      <div className="flex items-center justify-between py-2 mb-3">
        <div className="flex items-center gap-3 text-sm">
          {likesCount > 0 && (
            <span
              onClick={() => setShowLikesModal(true)}
              className="text-gray-600 hover:text-gray-900 hover:underline cursor-pointer transition-colors"
            >
              {likesCount} lượt thích
            </span>
          )}
          {totalCommentsCount > 0 && (
            <span
              onClick={() => setShowComments(!showComments)}
              className="text-gray-600 hover:text-gray-900 hover:underline cursor-pointer transition-colors"
            >
              {totalCommentsCount} bình luận
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-3 pt-2 border-t border-gray-200">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
            isLiked 
              ? 'text-red-600 bg-red-50 hover:bg-red-100' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">Thích</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Bình luận</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 pt-3">
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

      {/* Image Modal */}
      {showImageModal && (
        <ImageModal
          images={imageUrls}
          initialIndex={selectedImageIndex}
          onClose={() => setShowImageModal(false)}
        />
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <EditPostModal
          post={post}
          onSubmit={handleEditPost}
          onCancel={() => setShowEditModal(false)}
          currentUser={currentUser}
          isLoading={updatePostMutation.isPending}
        />
      )}

      {/* Likes Modal */}
      {showLikesModal && (
        <LikesModal
          likes={localLikedBy}
          onClose={() => setShowLikesModal(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default PostCard;
