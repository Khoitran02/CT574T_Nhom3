import { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { postsAPI, usersAPI, relationshipsAPI } from '../services/api';
import { Filter, X } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import FeedHeader from '../components/Feed/FeedHeader';
import CreatePostButton from '../components/Feed/CreatePostButton';
import CreatePostForm from '../components/Feed/CreatePostForm';
import PostCard from '../components/Feed/PostCard';
import UserStats from '../components/Feed/UserStats';
import UserSuggestions from '../components/Feed/UserSuggestions';

const Feed = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newPost, setNewPost] = useState({ content: '' });
  const observerTarget = useRef(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    author: '',
    fromDate: '',
    toDate: '',
  });

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

  // Infinite scroll query
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading,
  } = useInfiniteQuery({
    queryKey: ['feed-posts', filters],
    queryFn: ({ pageParam = 1 }) => postsAPI.getAll({ 
      page: pageParam, 
      limit: 20,
      author: filters.author,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.data.pagination;
      return pagination.hasNext ? pagination.page + 1 : undefined;
    },
    enabled: !!currentUser,
  });

  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll({ limit: 100 }),
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
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
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

  // Flatten posts from all pages
  const allPosts = postsData?.pages?.flatMap(page => page.data.data) || [];
  const users = usersResponse?.data?.data || [];
  const stats = statsData?.data?.data || { followersCount: 0, followingCount: 0 };
  const followingIds = followingIdsData?.data?.data || [];

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Trigger when user scrolls near the 16th post
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Lọc admin và chính mình khỏi danh sách gợi ý
  const suggestedUsers = users
    .filter((u) => u._id !== currentUser?._id && u.role !== 'admin')
    .slice(0, 5);

  const handleFollow = (userId) => {
    if (currentUser) {
      followMutation.mutate({
        followerId: currentUser._id,
        followeeId: userId,
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      author: '',
      fromDate: '',
      toDate: '',
    });
  };

  const hasActiveFilters = filters.author || filters.fromDate || filters.toDate;

  if (!currentUser || postsLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <FeedHeader userName={currentUser.name} />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <CreatePostButton onClick={() => setShowPostForm(true)} />

            {/* Filter Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  hasActiveFilters 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Lọc bài viết
                {hasActiveFilters && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {[filters.author, filters.fromDate, filters.toDate].filter(Boolean).length}
                  </span>
                )}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Bộ lọc bài viết</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên người đăng
                    </label>
                    <input
                      type="text"
                      value={filters.author}
                      onChange={(e) => handleFilterChange('author', e.target.value)}
                      placeholder="Nhập tên..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => handleFilterChange('toDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Posts List */}
            {allPosts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center text-gray-500">
                {hasActiveFilters ? 'Không tìm thấy bài viết nào với bộ lọc này.' : 'Chưa có bài viết nào.'}
              </div>
            ) : (
              <>
                {allPosts.map((post) => (
                  <PostCard key={post.id} post={post} currentUser={currentUser} />
                ))}
                
                {/* Observer target at the end for infinite scroll */}
                {hasNextPage && (
                  <div ref={observerTarget} className="h-10 flex items-center justify-center">
                    {isFetchingNextPage && <LoadingSpinner />}
                  </div>
                )}
                
                {/* End of posts message */}
                {!hasNextPage && allPosts.length > 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Đã hiển thị tất cả bài viết
                  </div>
                )}
              </>
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
        <CreatePostForm
          currentUser={currentUser}
          onSubmit={(formData) => createPostMutation.mutate(formData)}
          onCancel={() => setShowPostForm(false)}
        />
      </Modal>
    </div>
  );
};

export default Feed;
