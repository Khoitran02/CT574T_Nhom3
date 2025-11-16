import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { usersAPI, relationshipsAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import SearchBar from '../components/Social/SearchBar';
import UserGrid from '../components/Social/UserGrid';

const SocialNetwork = () => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForInfo, setSelectedUserForInfo] = useState(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersAPI.getAll,
  });

  const { data: followersDataModal, isLoading: followersLoadingModal } = useQuery({
    queryKey: ['followers-modal', selectedUserId],
    queryFn: () => relationshipsAPI.getFollowers(selectedUserId),
    enabled: showFollowersModal && !!selectedUserId,
  });

  const { data: followingDataModal, isLoading: followingLoadingModal } = useQuery({
    queryKey: ['following-modal', selectedUserId],
    queryFn: () => relationshipsAPI.getFollowing(selectedUserId),
    enabled: showFollowingModal && !!selectedUserId,
  });

  // Transform MongoDB user data to match component expectations
  const transformUsers = (mongoUsers) => {
    return mongoUsers
      .filter(user => user.role !== 'admin') // Ẩn admin
      .map(user => ({
        user_id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.name,
      }));
  };

  const users = usersResponse?.data?.data || [];
  const transformedUsers = transformUsers(users);
  
  // Transform Neo4j followers/following data
  const transformNeo4jUsers = (neo4jData) => {
    return (neo4jData || []).map(item => ({
      user_id: item.user.id,
      username: item.user.username,
      email: item.user.email,
      full_name: item.user.name,
    }));
  };
  
  const followersListModal = transformNeo4jUsers(followersDataModal?.data?.data);
  const followingListModal = transformNeo4jUsers(followingDataModal?.data?.data);
  const currentUserId = transformedUsers[0]?.user_id;

  const filteredUsers = transformedUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewFollowers = (userId) => {
    setSelectedUserId(userId);
    setShowFollowersModal(true);
  };

  const handleViewFollowing = (userId) => {
    setSelectedUserId(userId);
    setShowFollowingModal(true);
  };

  if (usersLoading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <Users className="text-blue-500" />
          Social Network
        </h1>
        
        <SearchBar 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm kiếm users..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UserGrid
          users={filteredUsers}
          currentUserId={currentUserId}
          showFollowButton={false}
          showViewInfo={false}
          onViewFollowers={handleViewFollowers}
          onViewFollowing={handleViewFollowing}
          onViewUserInfo={(user) => setSelectedUserForInfo(user)}
          emptyMessage={searchTerm ? 'Không tìm thấy users nào' : 'Chưa có users nào'}
        />
      </div>

      {/* Followers Modal */}
      <Modal
        isOpen={showFollowersModal}
        onClose={() => {
          setShowFollowersModal(false);
          setSelectedUserId('');
        }}
        title="Danh sách Followers"
        size="lg"
      >
        {followersLoadingModal ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {followersListModal.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Chưa có followers</p>
            ) : (
              followersListModal.map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => setSelectedUserForInfo(user)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <h4 className="font-semibold text-gray-900">{user.username}</h4>
                  <p className="text-sm text-gray-600">{user.full_name}</p>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>

      {/* Following Modal */}
      <Modal
        isOpen={showFollowingModal}
        onClose={() => {
          setShowFollowingModal(false);
          setSelectedUserId('');
        }}
        title="Danh sách Following"
        size="lg"
      >
        {followingLoadingModal ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {followingListModal.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Chưa follow ai</p>
            ) : (
              followingListModal.map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => setSelectedUserForInfo(user)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <h4 className="font-semibold text-gray-900">{user.username}</h4>
                  <p className="text-sm text-gray-600">{user.full_name}</p>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>

      {/* User Info Modal */}
      <Modal
        isOpen={!!selectedUserForInfo}
        onClose={() => setSelectedUserForInfo(null)}
        title="Thông tin người dùng"
      >
        {selectedUserForInfo && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Tên người dùng</label>
              <p className="text-gray-900 text-left">{selectedUserForInfo.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Họ tên</label>
              <p className="text-gray-900 text-left">{selectedUserForInfo.full_name || 'Chưa cập nhật'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Email</label>
              <p className="text-gray-900 text-left">{selectedUserForInfo.email}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SocialNetwork;