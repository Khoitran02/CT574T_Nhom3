import FollowButton from '../Social/FollowButton';
import UserStats from '../Social/UserStats';

const SocialUserCard = ({ user, currentUserId, showFollowButton = true, onViewFollowers, onViewFollowing }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{user.username}</h3>
          {user.full_name && (
            <p className="text-gray-600 mb-2">{user.full_name}</p>
          )}
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>
        {showFollowButton && currentUserId && (
          <FollowButton 
            currentUserId={currentUserId} 
            targetUserId={user.user_id}
          />
        )}
      </div>
      
      <UserStats userId={user.user_id} />
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onViewFollowers(user.user_id)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Xem Followers
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => onViewFollowing(user.user_id)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Xem Following
        </button>
      </div>
    </div>
  );
};

export default SocialUserCard;
