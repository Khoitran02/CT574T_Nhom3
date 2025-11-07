import { User } from 'lucide-react';
import UserCard from './UserCard';
import EmptyState from '../UI/EmptyState';

const UserList = ({ users, currentUserId, onEdit, onDelete }) => {
  if (users.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 text-left">Danh sách Users</h2>
        </div>
        <EmptyState 
          icon={User}
          message="Chưa có users nào. Hãy tạo user đầu tiên!"
        />
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 text-left">Danh sách Users</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {users.map((user) => (
          <UserCard
            key={user._id}
            user={user}
            currentUserId={currentUserId}
            onEdit={() => onEdit(user)}
            onDelete={() => onDelete(user._id)}
          />
        ))}
      </div>
    </div>
  );
};

export default UserList;
