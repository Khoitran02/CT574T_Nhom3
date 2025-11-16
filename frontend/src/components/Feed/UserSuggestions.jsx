import { UserPlus, UserCheck } from 'lucide-react';

const UserSuggestions = ({ users, onFollow, followingIds = [] }) => {
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="font-bold text-gray-900 mb-3">Gợi ý kết bạn</h2>
      <div className="space-y-3">
        {users.map((user) => {
          const isFollowing = followingIds.includes(user._id);
          
          return (
            <div key={user._id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold">
                  {user.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>
              <button
                onClick={() => onFollow(user._id)}
                disabled={isFollowing}
                className={`flex items-center gap-1 transition-colors ${
                  isFollowing 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
                title={isFollowing ? 'Đã follow' : 'Follow'}
              >
                {isFollowing ? (
                  <UserCheck className="w-5 h-5" />
                ) : (
                  <UserPlus className="w-5 h-5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserSuggestions;
