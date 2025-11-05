// components/Social/FollowButton.jsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserMinus } from 'lucide-react';
import { followUser, unfollowUser, checkFollowStatus } from '../../services/api';

const FollowButton = ({ currentUserId, targetUserId }) => {
  const queryClient = useQueryClient();
  
  // Check if currently following
  const { data: followStatus } = useQuery({
    queryKey: ['followStatus', currentUserId, targetUserId],
    queryFn: () => checkFollowStatus(currentUserId, targetUserId),
    enabled: !!currentUserId && !!targetUserId && currentUserId !== targetUserId
  });
  
  const isFollowing = followStatus?.isFollowing || false;
  
  // Follow mutation
  const followMutation = useMutation({
    mutationFn: () => followUser(currentUserId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
  
  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(currentUserId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
  
  const handleFollow = () => {
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
  
  const isLoading = followMutation.isPending || unfollowMutation.isPending;
  
  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600'
          : 'bg-blue-500 text-white hover:bg-blue-600'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
      `}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
          {isFollowing ? 'Đang unfollow...' : 'Đang follow...'}
        </>
      ) : (
        <>
          {isFollowing ? (
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
        </>
      )}
    </button>
  );
};

export default FollowButton;