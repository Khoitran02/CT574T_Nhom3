import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI } from '../services/api';
import { FileText } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ErrorMessage from '../components/UI/ErrorMessage';
import PostStatsGrid from '../components/Posts/PostStatsGrid';
import PostList from '../components/Posts/PostList';

const Posts = () => {
  const [editingPost, setEditingPost] = useState(null);
  const queryClient = useQueryClient();

  const { data: postsResponse, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: postsAPI.getAll,
  });

  const deletePostMutation = useMutation({
    mutationFn: postsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const posts = postsResponse?.data?.data || [];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage title="Lỗi khi tải danh sách posts" message={error.message} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 mr-3" />
            Quản lý Posts
          </h1>
          <p className="text-gray-600 mt-1">
            Bài viết được lưu trữ phân tán trên MongoDB Sharded Cluster
          </p>
        </div>
        {/* Admin chỉ xem và quản lý, không tạo post */}
      </div>

      <PostStatsGrid posts={posts} />
      
      <PostList 
        posts={posts}
        onEdit={setEditingPost}
        onDelete={(id) => deletePostMutation.mutate(id)}
      />
    </div>
  );
};

export default Posts;