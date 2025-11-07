import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { usersAPI, getFollowers, getFollowing } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import SearchBar from '../components/Social/SearchBar';
import ViewTabs from '../components/Social/ViewTabs';
import UserGrid from '../components/Social/UserGrid';

const SocialNetwork = () => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [view, setView] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersAPI.getAll();
      return response.data;
    }
  });

  const { data: followersData, isLoading: followersLoading } = useQuery({
    queryKey: ['followers', selectedUserId],
    queryFn: () => getFollowers(selectedUserId),
    enabled: view === 'followers' && !!selectedUserId
  });

  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: ['following', selectedUserId],
    queryFn: () => getFollowing(selectedUserId),
    enabled: view === 'following' && !!selectedUserId
  });

  const users = usersResponse?.users || [];
  const followers = followersData?.followers || [];
  const following = followingData?.following || [];
  const currentUserId = users[0]?.user_id;

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewFollowers = (userId) => {
    setSelectedUserId(userId);
    setView('followers');
  };

  const handleViewFollowing = (userId) => {
    setSelectedUserId(userId);
    setView('following');
  };

  const renderContent = () => {
    if (view === 'users' && usersLoading) return <LoadingSpinner />;
    if (view === 'followers' && followersLoading) return <LoadingSpinner />;
    if (view === 'following' && followingLoading) return <LoadingSpinner />;

    const viewConfig = {
      users: {
        data: filteredUsers,
        emptyMessage: searchTerm ? 'Không tìm thấy users nào' : 'Chưa có users nào'
      },
      followers: {
        data: followers,
        emptyMessage: 'Chưa có followers'
      },
      following: {
        data: following,
        emptyMessage: 'Chưa follow ai'
      }
    };

    const { data, emptyMessage } = viewConfig[view];

    return (
      <UserGrid
        users={data}
        currentUserId={currentUserId}
        onViewFollowers={handleViewFollowers}
        onViewFollowing={handleViewFollowing}
        emptyMessage={emptyMessage}
      />
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <Users className="text-blue-500" />
          Social Network
        </h1>
        
        <ViewTabs 
          view={view}
          selectedUserId={selectedUserId}
          onViewChange={setView}
        />
        
        <SearchBar 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm kiếm users..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default SocialNetwork;