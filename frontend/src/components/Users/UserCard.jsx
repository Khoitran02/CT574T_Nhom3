import { Edit, Trash2 } from 'lucide-react';
import FollowButton from '../Social/FollowButton';
import UserStats from '../Social/UserStats';

const UserCard = ({ user, currentUserId, onEdit, onDelete }) => {
  return (
    <div className="px-6 py-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {user.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">@{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="mt-1">
              <UserStats userId={user.user_id} />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {currentUserId && (
            <FollowButton 
              currentUserId={currentUserId} 
              targetUserId={user.user_id}
            />
          )}
          <span className={`px-2 py-1 text-xs rounded-full ${
            user.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {user.bio && (
        <p className="mt-2 text-sm text-gray-600 ml-14">{user.bio}</p>
      )}
    </div>
  );
};

export default UserCard;
