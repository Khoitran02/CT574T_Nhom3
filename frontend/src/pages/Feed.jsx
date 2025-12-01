import { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { postsAPI, relationshipsAPI } from '../services/api';
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
  
  // Temporary filter states (chưa apply)
  const [tempFilters, setTempFilters] = useState({
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
    queryKey: ['feed-posts', filters, currentUser?._id],
    queryFn: ({ pageParam = 1 }) => postsAPI.getAll({ 
      page: pageParam, 
      limit: 20,
      userId: currentUser?._id, // Truyền userId để backend filter theo visibility
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

  const handleFollow = (userId) => {
    if (currentUser) {
      followMutation.mutate({
        followerId: currentUser._id,
        followeeId: userId,
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      author: '',
      fromDate: '',
      toDate: '',
    };
    setFilters(emptyFilters);
    setTempFilters(emptyFilters);
  };

  const hasActiveFilters = filters.author || filters.fromDate || filters.toDate;

  if (!currentUser || postsLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <FeedHeader userName={currentUser.name} />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
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
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Filter className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Lọc bài viết</h3>
                      <p className="text-xs text-gray-500">Tìm kiếm bài viết theo tiêu chí</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                {/* Body */}
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Author Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Người đăng
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={tempFilters.author}
                          onChange={(e) => handleFilterChange('author', e.target.value)}
                          placeholder="Tìm theo tên người đăng..."
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Khoảng thời gian
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <input
                            type="date"
                            value={tempFilters.fromDate}
                            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                          />
                          <span className="absolute -bottom-5 left-0 text-xs text-gray-500">Từ ngày</span>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <input
                            type="date"
                            value={tempFilters.toDate}
                            onChange={(e) => handleFilterChange('toDate', e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                          />
                          <span className="absolute -bottom-5 left-0 text-xs text-gray-500">Đến ngày</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between rounded-b-xl">
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Xóa tất cả
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleApplyFilters}
                      className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm hover:shadow transition-all"
                    >
                      Áp dụng
                    </button>
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
              currentUserId={currentUser._id}
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
