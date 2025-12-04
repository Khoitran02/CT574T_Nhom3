import { X, UserPlus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { relationshipsAPI } from '../../services/api';
import { getResourceUrl } from '../../utils/url';

const LikesModal = ({ likes = [], onClose, currentUser }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get following IDs
  const { data: followingIdsData } = useQuery({
    queryKey: ['followingIds', currentUser?._id],
    queryFn: () => relationshipsAPI.getFollowingIds(currentUser._id),
    enabled: !!currentUser,
  });

  const followingIds = followingIdsData?.data?.data || [];

  const followMutation = useMutation({
    mutationFn: ({ followerId, followeeId }) =>
      relationshipsAPI.follow(followerId, followeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followingIds'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const handleUserClick = (userId, e) => {
    // Don't navigate if clicking on follow button
    if (e.target.closest('button')) return;
    
    if (userId !== currentUser?._id) {
      navigate(`/profile/${userId}`);
      onClose();
    }
  };

  const handleFollow = (userId, e) => {
    e.stopPropagation();
    if (currentUser) {
      followMutation.mutate({
        followerId: currentUser._id,
        followeeId: userId,
      });
    }
  };

  const isFollowing = (userId) => followingIds.includes(userId);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Lượt thích</h2>
            <span className="text-gray-500">({likes.length})</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {likes.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-sm">Chưa có ai thích bài viết này</p>
            </div>
          ) : (
            <div>
              {likes.map((user) => (
                <div
                  key={user._id}
                  onClick={(e) => handleUserClick(user._id, e)}
                  className={`px-4 py-3 flex items-center gap-3 ${
                    user._id !== currentUser?._id ? 'hover:bg-gray-50 cursor-pointer' : ''
                  } transition-colors`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={getResourceUrl(user.avatar)}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm border border-gray-200"
                      style={{ display: user.avatar ? 'none' : 'flex' }}
                    >
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-gray-900 text-sm truncate">
                      {user.name}
                    </div>
                    {user.email && (
                      <div className="text-xs text-gray-500 truncate">
                        {user.email}
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  {user._id === currentUser?._id ? (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      Bạn
                    </span>
                  ) : isFollowing(user._id) ? (
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      disabled
                    >
                      <Check className="w-3.5 h-3.5" />
                      Đang theo dõi
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleFollow(user._id, e)}
                      disabled={followMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Theo dõi
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikesModal;
