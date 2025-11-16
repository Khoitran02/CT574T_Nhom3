import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { postsAPI, usersAPI, relationshipsAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import FeedHeader from '../components/Feed/FeedHeader';
import CreatePostButton from '../components/Feed/CreatePostButton';
import PostCard from '../components/Feed/PostCard';
import UserStats from '../components/Feed/UserStats';
import UserSuggestions from '../components/Feed/UserSuggestions';

const Feed = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ content: '' });

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

  const { data: postsResponse, isLoading: postsLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: postsAPI.getAll,
  });

  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: usersAPI.getAll,
  });

  const { data: statsData } = useQuery({
    queryKey: ['stats', currentUser?._id],
    queryFn: () => relationshipsAPI.getStats(currentUser._id),
    enabled: !!currentUser,
  });

  const { data: followingIdsData } = useQuery({
    queryKey: ['followingIds', currentUser?._id],
    queryFn: () => relationshipsAPI.getFollowingIds(currentUser._id),
    enabled: !!currentUser,
  });

  const createPostMutation = useMutation({
    mutationFn: postsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setShowPostForm(false);
      setNewPost({ content: '' });
    },
  });

  const followMutation = useMutation({
    mutationFn: ({ followerId, followeeId }) =>
      relationshipsAPI.follow(followerId, followeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['followingIds'] });
    },
  });

  const posts = postsResponse?.data?.data || [];
  const users = usersResponse?.data?.data || [];
  const stats = statsData?.data?.data || { followersCount: 0, followingCount: 0 };
  const followingIds = followingIdsData?.data?.data || [];

  // Feed hiển thị tất cả bài viết (bao gồm của mình), sắp xếp mới nhất lên đầu, giới hạn 10 bài
  const feedPosts = posts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  // Lọc admin và chính mình khỏi danh sách gợi ý
  const suggestedUsers = users
    .filter((u) => u._id !== currentUser?._id && u.role !== 'admin')
    .slice(0, 5);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (currentUser && newPost.content) {
      createPostMutation.mutate({
        content: newPost.content,
        author: currentUser.name,
        userId: currentUser._id,
      });
    }
  };

  const handleFollow = (userId) => {
    if (currentUser) {
      followMutation.mutate({
        followerId: currentUser._id,
        followeeId: userId,
      });
    }
  };

  if (!currentUser || postsLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <FeedHeader userName={currentUser.name} />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <CreatePostButton onClick={() => setShowPostForm(true)} />

            {feedPosts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center text-gray-500">
                Chưa có bài viết nào từ người khác.
              </div>
            ) : (
              feedPosts.map((post) => (
                <PostCard key={post.id} post={post} currentUser={currentUser} />
              ))
            )}
          </div>

          {/* Sidebar - Hidden on mobile */}
          <div className="hidden lg:block space-y-4">
            <UserStats stats={stats} />
            <UserSuggestions 
              users={suggestedUsers} 
              onFollow={handleFollow}
              followingIds={followingIds}
            />
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <Modal
        isOpen={showPostForm}
        onClose={() => setShowPostForm(false)}
        title="Tạo bài viết mới"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              Nội dung
            </label>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              required
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Bạn đang nghĩ gì?"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPostForm(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createPostMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {createPostMutation.isPending ? 'Đang đăng...' : 'Đăng bài'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Feed;
