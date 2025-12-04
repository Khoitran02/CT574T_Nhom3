import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, UserCheck, FileText } from 'lucide-react';
import { usersAPI, relationshipsAPI, postsAPI } from '../services/api';
import { getResourceUrl } from '../utils/url';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PostCard from '../components/Feed/PostCard';
import FollowButton from '../components/Social/FollowButton';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      navigate('/login');
    } else {
      setCurrentUser(user);
      // Nếu xem profile của chính mình, redirect về /profile
      if (user._id === userId) {
        navigate('/profile');
      }
    }
  }, [navigate, userId]);

  const { data: userResponse, isLoading: userLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersAPI.getById(userId),
    enabled: !!userId && !!currentUser,
  });

  const { data: statsData } = useQuery({
    queryKey: ['stats', userId],
    queryFn: () => relationshipsAPI.getStats(userId),
    enabled: !!userId,
  });

  const { data: postsResponse } = useQuery({
    queryKey: ['posts', currentUser?._id],
    queryFn: () => postsAPI.getAll({ userId: currentUser?._id }), // Truyền currentUser._id để filter visibility
    enabled: !!userId && !!currentUser,
  });

  if (!currentUser || userLoading) return <LoadingSpinner />;

  const user = userResponse?.data?.data;
  if (!user) return <div className="text-center py-8">Không tìm thấy người dùng</div>;

  const stats = statsData?.data?.data || { followersCount: 0, followingCount: 0 };
  const allPosts = postsResponse?.data?.data || [];
  const userPosts = allPosts.filter((post) => 
    post.authorId === userId || post.userId === userId
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {user.avatar ? (
                <img
                  src={getResourceUrl(user.avatar)}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {user.name[0].toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">@{user.username}</p>
                <p className="text-gray-500 text-sm">{user.email}</p>
              </div>
            </div>
            <FollowButton 
              currentUserId={currentUser._id} 
              targetUserId={userId} 
            />
          </div>

          {user.bio && (
            <div className="mb-6">
              <p className="text-gray-700">{user.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <UserCheck className="w-5 h-5" />
                <span className="text-sm">Đang theo dõi</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.followingCount}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="w-5 h-5" />
                <span className="text-sm">Người theo dõi</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.followersCount}</p>
            </div>
          </div>
        </div>

        {/* User Posts Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Bài viết ({userPosts.length})
          </h3>
          {userPosts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Chưa có bài viết nào.</p>
          ) : (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} currentUser={currentUser} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
