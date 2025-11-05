// pages/SocialNetwork.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, UserCheck, Search } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import FollowButton from '../components/Social/FollowButton';
import UserStats from '../components/Social/UserStats';
import { usersAPI, getFollowers, getFollowing } from '../services/api';

const SocialNetwork = () => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [view, setView] = useState('users'); // 'users', 'followers', 'following'
  const [searchTerm, setSearchTerm] = useState('');

  // Get all users
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersAPI.getAll();
      return response.data;
    }
  });

  // Get followers when view is 'followers'
  const { data: followersData, isLoading: followersLoading } = useQuery({
    queryKey: ['followers', selectedUserId],
    queryFn: () => getFollowers(selectedUserId),
    enabled: view === 'followers' && !!selectedUserId
  });

  // Get following when view is 'following'
  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: ['following', selectedUserId],
    queryFn: () => getFollowing(selectedUserId),
    enabled: view === 'following' && !!selectedUserId
  });

  const users = usersResponse?.users || [];
  const followers = followersData?.followers || [];
  const following = followingData?.following || [];
  
  // Mock current user (in real app, this would come from auth context)
  const currentUserId = users.length > 0 ? users[0].user_id : null;

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderUserCard = (user, showFollowButton = true) => (
    <div key={user.user_id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{user.username}</h3>
          {user.full_name && (
            <p className="text-gray-600 mb-2">{user.full_name}</p>
          )}
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>
        {showFollowButton && (
          <FollowButton 
            currentUserId={currentUserId} 
            targetUserId={user.user_id}
          />
        )}
      </div>
      
      <UserStats userId={user.user_id} />
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            setSelectedUserId(user.user_id);
            setView('followers');
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Xem Followers
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => {
            setSelectedUserId(user.user_id);
            setView('following');
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Xem Following
        </button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Users className="text-blue-500" />
            Social Network
          </h1>
          
          {/* Navigation */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => setView('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'users'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              All Users
            </button>
            
            {selectedUserId && (
              <>
                <button
                  onClick={() => setView('followers')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    view === 'followers'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Followers
                </button>
                
                <button
                  onClick={() => setView('following')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    view === 'following'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Following
                </button>
              </>
            )}
          </div>
          
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {view === 'users' && (
            <>
              {usersLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : (
                filteredUsers.map(user => renderUserCard(user))
              )}
            </>
          )}
          
          {view === 'followers' && (
            <>
              {followersLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : followers.length > 0 ? (
                followers.map(user => renderUserCard(user))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  Chưa có followers
                </div>
              )}
            </>
          )}
          
          {view === 'following' && (
            <>
              {followingLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : following.length > 0 ? (
                following.map(user => renderUserCard(user))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  Chưa follow ai
                </div>
              )}
            </>
          )}
        </div>

        {view === 'users' && filteredUsers.length === 0 && !usersLoading && (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy users nào
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SocialNetwork;