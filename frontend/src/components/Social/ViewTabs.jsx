import { Users, UserPlus, UserCheck } from 'lucide-react';

const ViewTabs = ({ view, selectedUserId, onViewChange }) => {
  const tabs = [
    { id: 'users', label: 'All Users', icon: Users },
    ...(selectedUserId ? [
      { id: 'followers', label: 'Followers', icon: UserPlus },
      { id: 'following', label: 'Following', icon: UserCheck }
    ] : [])
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onViewChange(id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            view === id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </button>
      ))}
    </div>
  );
};

export default ViewTabs;
