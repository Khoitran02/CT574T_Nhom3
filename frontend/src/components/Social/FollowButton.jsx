// components/Social/FollowButton.jsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { relationshipsAPI } from '../../services/api';

const FollowButton = ({ currentUserId, targetUserId }) => {
  const queryClient = useQueryClient();
  
  // Check if currently following by getting following IDs
  const { data: followingIds = [] } = useQuery({
    queryKey: ['followingIds', currentUserId],
    queryFn: async () => {
      const response = await relationshipsAPI.getFollowingIds(currentUserId);
      return response.data.data || [];
    },
    enabled: !!currentUserId,
    staleTime: 30000, // Cache for 30 seconds
  });
  
  const isFollowing = followingIds.includes(targetUserId);
  
  // Follow mutation
  const followMutation = useMutation({
    mutationFn: () => relationshipsAPI.follow(currentUserId, targetUserId),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['followingIds', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
  
  const handleFollow = () => {
    if (!isFollowing) {
      followMutation.mutate();
    }
  };
  
  // Don't show follow button for self or if already following
  if (!currentUserId || !targetUserId || currentUserId === targetUserId || isFollowing) {
    return null;
  }
  
  const isLoading = followMutation.isPending;
  
  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        bg-blue-500 text-white hover:bg-blue-600
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
      `}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-white" />
          Đang follow...
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