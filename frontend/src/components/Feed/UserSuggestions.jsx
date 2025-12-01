import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users } from 'lucide-react';
import { relationshipsAPI } from '../../services/api';

const UserSuggestions = ({ currentUserId, onFollow, followingIds = [] }) => {
  const navigate = useNavigate();
  
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="font-bold text-gray-900">Gợi ý kết nối</h2>
      </div>

      {/* Suggestions List */}
      <div className="p-3 space-y-3">
        {suggestions.map((suggestion) => {
          const user = suggestion.user;
          const isFollowing = followingIds.includes(user.id);
          
          return (
            <div 
              key={user.id} 
              className="flex items-center gap-3"
            >
              {/* Avatar */}
              <div 
                className="cursor-pointer flex-shrink-0"
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm hover:shadow-md transition-shadow">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
              </div>

              {/* User Info - Flex 1 to take remaining space */}
              <div className="flex-1 min-w-0 text-left">
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <p className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors leading-tight truncate text-left">
                    {user.name}
                  </p>
                </div>
                
                {/* Stats - Below name */}
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 text-left">
                  <span>{suggestion.mutualFollowing || 0} bạn chung</span>
                  <span>•</span>
                  <span>{suggestion.popularity || 0} người theo dõi</span>
                </div>
              </div>

              {/* Follow Icon Button - Right side */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFollow(user.id);
                }}
                disabled={isFollowing}
                className={`p-2 rounded-md transition-all flex-shrink-0 ${
                  isFollowing 
                    ? 'border border-gray-300 text-gray-400 cursor-not-allowed' 
                    : 'border border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-95'
                }`}
                title={isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
              >
                <UserPlus size={18} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <button
          onClick={() => navigate('/suggestions')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline w-full text-center"
        >
          Xem tất cả
        </button>
      </div>
    </div>
  );
};

export default UserSuggestions;
