import { useState, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { relationshipsAPI } from '../../services/api';

const ProfileFollowButton = ({ currentUserId, targetUserId }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Check if following on mount
  useEffect(() => {
    const checkFollowing = async () => {
      if (!currentUserId || !targetUserId) return;
      
      try {
        const response = await relationshipsAPI.getFollowingIds(currentUserId);
        const followingIds = response.data.data || [];
        const following = followingIds.includes(targetUserId);
        
        console.log('Follow status check:', {
          currentUserId,
          targetUserId,
          followingIds,
          isFollowing: following
        });
        
        setIsFollowing(following);
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkFollowing();
  }, [currentUserId, targetUserId]);

  const handleToggleFollow = async () => {
    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      console.log('Toggling follow:', { isFollowing, currentUserId, targetUserId });
      
      if (isFollowing) {
        const response = await relationshipsAPI.unfollow(currentUserId, targetUserId);
        console.log('Unfollow response:', response.data);
      } else {
        const response = await relationshipsAPI.follow(currentUserId, targetUserId);
        console.log('Follow response:', response.data);
      }
      
      // Reload page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('Error toggling follow:', error);
      setActionLoading(false);
    }
  };

  // Don't show for self or if loading
  if (!currentUserId || !targetUserId || currentUserId === targetUserId || loading) {
    return null;
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={actionLoading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${isFollowing
          ? 'bg-gray-500 text-white hover:bg-gray-600'
          : 'bg-blue-500 text-white hover:bg-blue-600'
        }
        hover:shadow-md
        ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {actionLoading ? (
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

export default ProfileFollowButton;
