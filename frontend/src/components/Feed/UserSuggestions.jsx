import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, ArrowRight } from 'lucide-react';
import { relationshipsAPI } from '../../services/api';

const UserSuggestions = ({ currentUserId, onFollow, followingIds = [] }) => {
  const navigate = useNavigate();
  // Fetch Neo4j suggestions
  const { data: suggestionsData, isLoading } = useQuery({
    queryKey: ['sidebar-suggestions', currentUserId],
    queryFn: () => relationshipsAPI.getSuggestions(currentUserId, { limit: 5 }),
    enabled: !!currentUserId,
  });

  const suggestions = suggestionsData?.data?.data || [];

  if (isLoading || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900">Gợi ý kết nối</h2>
        <a
          href="/suggestions"
          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          Xem tất cả
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>
      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const user = suggestion.user;
          const isFollowing = followingIds.includes(user.id);
          
          return (
            <div key={user.id} className="flex items-center justify-between">
              <div 
                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:bg-gray-50 rounded p-1 -m-1"
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate hover:text-blue-600">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {suggestion.mutualFollowing} bạn chung
                  </p>
                </div>
              </div>
              <button
                onClick={() => onFollow(user.id)}
                disabled={isFollowing}
                className={`flex items-center gap-1 transition-colors flex-shrink-0 ml-2 ${
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
