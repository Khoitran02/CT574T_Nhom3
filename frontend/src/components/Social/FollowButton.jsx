// components/Social/FollowButton.jsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserMinus } from 'lucide-react';
import { relationshipsAPI } from '../../services/api';

const FollowButton = ({ currentUserId, targetUserId }) => {
  const queryClient = useQueryClient();
  
  // Check if currently following by getting following IDs
  const { data: followingIds = [] } = useQuery({
    queryKey: ['followingIds', currentUserId],
    queryFn: async () => {
      const response = await relationshipsAPI.getFollowingIds(currentUserId);
      return response.data || [];
    },
    enabled: !!currentUserId,
  });
  
  const isFollowing = Array.isArray(followingIds) && followingIds.includes(targetUserId);
  
  // Follow mutation
  const followMutation = useMutation({
    mutationFn: () => relationshipsAPI.follow(currentUserId, targetUserId),
    onSuccess: () => {
      // Simply reload the page
      window.location.reload();
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: () => relationshipsAPI.unfollow(currentUserId, targetUserId),
    onSuccess: () => {
      // Simply reload the page
      window.location.reload();
    },
  });
  
  const handleToggleFollow = () => {
    if (followMutation.isPending || unfollowMutation.isPending) return;
    
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };
  
  // Don't show follow button for self
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return null;
  }

  const isPending = followMutation.isPending || unfollowMutation.isPending;
  
  return (
    <button
      onClick={handleToggleFollow}
      disabled={isPending}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${isFollowing
          ? 'bg-gray-500 text-white hover:bg-gray-600'
          : 'bg-blue-500 text-white hover:bg-blue-600'
        }
        hover:shadow-md
        ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isPending ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-white" />
          {isFollowing ? 'Đang unfollow...' : 'Đang follow...'}
        </>
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </button>
  );
};

export default FollowButton;