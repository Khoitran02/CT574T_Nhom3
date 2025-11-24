import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { UserPlus, RefreshCw } from 'lucide-react';
import { relationshipsAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Suggestions = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [followedUsers, setFollowedUsers] = useState(new Set());

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin');
    } else {
      setCurrentUser(user);
    }
  }, [navigate]);

  // Query for mutual following suggestions
  const { data: suggestionsData, isLoading, refetch } = useQuery({
    queryKey: ['suggestions-mutual', currentUser?._id],
    queryFn: () => relationshipsAPI.getSuggestions(currentUser._id, { limit: 15 }),
    enabled: !!currentUser,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: ({ followerId, followeeId }) => relationshipsAPI.follow(followerId, followeeId),
    onMutate: async ({ followeeId }) => {
      // Mark as followed immediately
      setFollowedUsers(prev => new Set([...prev, followeeId]));
    },
    onError: (error, { followeeId }) => {
      // Rollback on error
      setFollowedUsers(prev => {
        const next = new Set(prev);
        next.delete(followeeId);
        return next;
      });
    },
  });

  const handleFollow = (userId) => {
    if (!currentUser || followedUsers.has(userId)) return;
    followMutation.mutate({ followerId: currentUser._id, followeeId: userId });
  };

  const handleRefresh = () => {
    setFollowedUsers(new Set());
    refetch();
  };

  const suggestions = suggestionsData?.data?.data || [];

  if (!currentUser) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="text-blue-500" />
              Gợi ý kết nối
            </h1>
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Về Feed
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Description and Refresh Button */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Những người mà bạn bè của bạn đang follow
            </p>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Suggestions List */}
        {isLoading ? (
          <LoadingSpinner />
        ) : suggestions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có gợi ý nào
            </h3>
            <p className="text-gray-500">
              Hãy follow thêm người để nhận gợi ý dựa trên bạn chung.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.user.id}
                suggestion={suggestion}
                onFollow={handleFollow}
                isFollowed={followedUsers.has(suggestion.user.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Suggestion Card Component
const SuggestionCard = ({ suggestion, onFollow, isFollowed }) => {
  const user = suggestion.user;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      {/* User Avatar */}
      <div className="flex items-center justify-center mb-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
        </div>
      </div>

      {/* User Info */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {user.name || user.username}
        </h3>
        <p className="text-sm text-gray-500 mb-2">@{user.username}</p>
        <p className="text-xs text-gray-400">{user.email}</p>
      </div>

      {/* Reason Badge */}
      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-700 text-center font-medium">
            {suggestion.mutualFollowing} bạn chung • {suggestion.popularity} followers
          </p>
        </div>
      </div>

      {/* Follow Button */}
      <div className="flex justify-center">
        <button
          onClick={() => onFollow(user.id)}
          disabled={isFollowed}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${isFollowed
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
            }
          `}
        >
          {isFollowed ? (
            <>
              <UserPlus className="w-4 h-4" />
              Đã follow
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Follow
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Suggestions;
