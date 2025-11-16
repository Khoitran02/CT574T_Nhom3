import FollowButton from '../Social/FollowButton';
import UserStats from '../Social/UserStats';

const SocialUserCard = ({ user, currentUserId, showFollowButton = true, showViewInfo = true, onViewFollowers, onViewFollowing, onViewUserInfo }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{user.username}</h3>
        </div>
        {showFollowButton && currentUserId && (
          <FollowButton 
            currentUserId={currentUserId} 
            targetUserId={user.user_id}
          />
        )}
      </div>
      
      <UserStats userId={user.user_id} />
      
      <div className="mt-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => onViewFollowers && onViewFollowers(user.user_id)}
            className="flex-1 text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
          >
            Xem Followers
          </button>
          <button
            onClick={() => onViewFollowing && onViewFollowing(user.user_id)}
            className="flex-1 text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
          >
            Xem Following
          </button>
        </div>
        {showViewInfo && (
          <button
            onClick={() => onViewUserInfo && onViewUserInfo(user)}
            className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium py-2 px-4 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Xem thông tin
          </button>
        )}
      </div>
    </div>
  );
};

export default SocialUserCard;
