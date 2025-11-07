import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI } from '../services/api';
import { FileText, Plus } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ErrorMessage from '../components/UI/ErrorMessage';
import Modal from '../components/UI/Modal';
import PostStatsGrid from '../components/Posts/PostStatsGrid';
import PostList from '../components/Posts/PostList';
import PostForm from '../components/Posts/PostForm';

const Posts = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const queryClient = useQueryClient();

  const { data: postsResponse, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: postsAPI.getAll,
  });

  const createPostMutation = useMutation({
    mutationFn: postsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setShowForm(false);
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => postsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setEditingPost(null);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: postsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const posts = postsResponse?.data?.data || [];

  const handleSubmit = (formData) => {
    if (editingPost) {
      updatePostMutation.mutate({ id: editingPost.id, data: formData });
    } else {
      createPostMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingPost(null);
  };

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
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo Post
        </button>
      </div>

      <PostStatsGrid posts={posts} />
      
      <PostList 
        posts={posts}
        onEdit={setEditingPost}
        onDelete={(id) => deletePostMutation.mutate(id)}
      />

      <Modal
        isOpen={showForm || !!editingPost}
        onClose={handleClose}
        title={editingPost ? 'Cập nhật Post' : 'Tạo Post Mới'}
        size="lg"
      >
        <PostForm
          post={editingPost}
          onSubmit={handleSubmit}
          isLoading={createPostMutation.isPending || updatePostMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default Posts;