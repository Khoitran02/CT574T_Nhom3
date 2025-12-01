import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { User, Users, UserCheck, Lock, Edit, FileText, Camera } from 'lucide-react';
import { usersAPI, relationshipsAPI, authAPI, postsAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import PostCard from '../components/Feed/PostCard';
import CreatePostButton from '../components/Feed/CreatePostButton';

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', bio: '' });
  const [passwordFormData, setPasswordFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unfollowedUsers, setUnfollowedUsers] = useState(new Set());

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin');
    } else {
      setCurrentUser(user);
      setEditFormData({ name: user.name, email: user.email, bio: user.bio || '' });
    }
  }, [navigate]);

  const { data: statsData } = useQuery({
    queryKey: ['stats', currentUser?._id],
    queryFn: () => relationshipsAPI.getStats(currentUser._id),
    enabled: !!currentUser,
  });

  const { data: followersData } = useQuery({
    queryKey: ['followers', currentUser?._id],
    queryFn: async () => {
      const response = await relationshipsAPI.getFollowers(currentUser._id);
      return response.data;
    },
    enabled: showFollowersModal && !!currentUser,
  });

  const { data: followingData } = useQuery({
    queryKey: ['following', currentUser?._id],
    queryFn: async () => {
      const response = await relationshipsAPI.getFollowing(currentUser._id);
      return response.data;
    },
    enabled: showFollowingModal && !!currentUser,
  });

  const { data: postsResponse } = useQuery({
    queryKey: ['posts'],
    queryFn: postsAPI.getAll,
    enabled: !!currentUser,
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: (response) => {
      const updatedUser = { ...currentUser, ...response.data.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setShowEditModal(false);
      setSuccess('Cập nhật thông tin thành công!');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật thông tin');
      setSuccess('');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => {
      setShowChangePasswordModal(false);
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Đổi mật khẩu thành công!');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await usersAPI.updateAvatar(currentUser._id, formData);
      return response.data;
    },
    onSuccess: (response) => {
      const updatedUser = { ...currentUser, avatar: response.data.user.avatar };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setSuccess('Cập nhật ảnh đại diện thành công!');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật ảnh đại diện');
      setSuccess('');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: ({ followerId, followeeId }) => relationshipsAPI.unfollow(followerId, followeeId),
    onSuccess: (_, variables) => {
      setUnfollowedUsers(prev => new Set(prev).add(variables.followeeId));
      queryClient.invalidateQueries({ queryKey: ['stats', currentUser._id] });
      queryClient.invalidateQueries({ queryKey: ['followingIds', currentUser._id] });
    },
  });

  const followMutation = useMutation({
    mutationFn: ({ followerId, followeeId }) => relationshipsAPI.follow(followerId, followeeId),
    onSuccess: (_, variables) => {
      setUnfollowedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.followeeId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['stats', currentUser._id] });
      queryClient.invalidateQueries({ queryKey: ['followingIds', currentUser._id] });
    },
  });

  const removeFollowerMutation = useMutation({
    mutationFn: ({ userId, followerId }) => relationshipsAPI.removeFollower(userId, followerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers', currentUser._id] });
      queryClient.invalidateQueries({ queryKey: ['stats', currentUser._id] });
    },
  });

  const stats = statsData?.data?.data || { followersCount: 0, followingCount: 0 };
  const followers = followersData?.data || [];
  const following = followingData?.data || [];
  const allPosts = postsResponse?.data?.data || [];
  const myPosts = allPosts.filter((post) => post.userId === currentUser?._id);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (currentUser) {
      updateProfileMutation.mutate({ id: currentUser._id, data: editFormData });
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setError('');
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError('Mật khẩu mới không khớp');
      return;
    }
    
    if (passwordFormData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    changePasswordMutation.mutate({
      userId: currentUser._id,
      currentPassword: passwordFormData.currentPassword,
      newPassword: passwordFormData.newPassword,
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('Ảnh không được vượt quá 5MB');
        return;
      }
      updateAvatarMutation.mutate(file);
    }
  };

  if (!currentUser) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Trang cá nhân</h1>
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Về Feed
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-20 h-20 rounded-full object-cover cursor-pointer"
                    onClick={() => setShowAvatarModal(true)}
                  />
                ) : (
                  <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {currentUser.name[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={handleAvatarClick}
                  disabled={updateAvatarMutation.isPending}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                  title="Cập nhật ảnh đại diện"
                >
                  {updateAvatarMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentUser.name}</h2>
                <p className="text-gray-600">@{currentUser.username}</p>
                <p className="text-gray-500 text-sm">{currentUser.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
              >
                <Edit className="w-4 h-4" />
                Sửa
              </button>
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                <Lock className="w-4 h-4" />
                Đổi mật khẩu
              </button>
            </div>
          </div>

          {currentUser.bio && (
            <div className="mb-6">
              <p className="text-gray-700">{currentUser.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowFollowingModal(true)}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <UserCheck className="w-5 h-5" />
                <span className="text-sm">Đang theo dõi</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.followingCount}</p>
            </button>
            <button
              onClick={() => setShowFollowersModal(true)}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="w-5 h-5" />
                <span className="text-sm">Người theo dõi</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.followersCount}</p>
            </button>
          </div>
        </div>

        {/* My Posts Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Bài viết của tôi ({myPosts.length})
            </h3>
            <CreatePostButton />
          </div>
          {myPosts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Bạn chưa đăng bài viết nào.</p>
          ) : (
            <div className="space-y-4">
              {myPosts.map((post) => (
                <PostCard key={post.id} post={post} currentUser={currentUser} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Modal */}
      <Modal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        title="Ảnh đại diện"
        size="lg"
      >
        {currentUser.avatar && (
          <div className="space-y-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full max-h-96 object-contain rounded-lg"
            />
            <div className="text-center text-gray-600">
              <p className="font-semibold">{currentUser.name}</p>
              <p className="text-sm">Ảnh đại diện</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Followers Modal */}
      <Modal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        title="Người theo dõi"
        size="lg"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {followers.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Chưa có người theo dõi</p>
          ) : (
            followers.map((item) => (
              <div key={item.user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div 
                  className="cursor-pointer flex-1"
                  onClick={() => {
                    setShowFollowersModal(false);
                    navigate(`/profile/${item.user.id}`);
                  }}
                >
                  <h4 className="font-semibold text-gray-900 hover:text-blue-600">{item.user.name}</h4>
                  <p className="text-sm text-gray-600">@{item.user.email}</p>
                </div>
                <button
                  onClick={() => removeFollowerMutation.mutate({ userId: currentUser._id, followerId: item.user.id })}
                  disabled={removeFollowerMutation.isPending}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  Xóa
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Following Modal */}
      <Modal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title="Đang theo dõi"
        size="lg"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {following.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Chưa theo dõi ai</p>
          ) : (
            following.map((item) => {
              const isUnfollowed = unfollowedUsers.has(item.user.id);
              return (
                <div key={item.user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div 
                    className="cursor-pointer flex-1"
                    onClick={() => {
                      setShowFollowingModal(false);
                      navigate(`/profile/${item.user.id}`);
                    }}
                  >
                    <h4 className="font-semibold text-gray-900 hover:text-blue-600">{item.user.name}</h4>
                    <p className="text-sm text-gray-600">@{item.user.email}</p>
                  </div>
                  {isUnfollowed ? (
                    <button
                      onClick={() => followMutation.mutate({ followerId: currentUser._id, followeeId: item.user.id })}
                      disabled={followMutation.isPending}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      Follow
                    </button>
                  ) : (
                    <button
                      onClick={() => unfollowMutation.mutate({ followerId: currentUser._id, followeeId: item.user.id })}
                      disabled={unfollowMutation.isPending}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                    >
                      Unfollow
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setError('');
        }}
        title="Cập nhật thông tin"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Họ tên</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Email</label>
            <input
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Bio</label>
            <textarea
              value={editFormData.bio}
              onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Giới thiệu về bạn..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          setError('');
          setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }}
        title="Đổi mật khẩu"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={passwordFormData.currentPassword}
              onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Mật khẩu mới</label>
            <input
              type="password"
              value={passwordFormData.newPassword}
              onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={passwordFormData.confirmPassword}
              onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowChangePasswordModal(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {changePasswordMutation.isPending ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
