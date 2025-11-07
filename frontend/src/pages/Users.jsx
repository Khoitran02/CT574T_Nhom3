import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../services/api';
import { User, Plus } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ErrorMessage from '../components/UI/ErrorMessage';
import Modal from '../components/UI/Modal';
import UserStatsGrid from '../components/Users/UserStatsGrid';
import UserList from '../components/Users/UserList';
import UserForm from '../components/Users/UserForm';

const Users = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: usersResponse, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: usersAPI.getAll,
    retry: 1,
  });

  const createUserMutation = useMutation({
    mutationFn: usersAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: usersAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const users = usersResponse?.data?.data || [];
  const currentUserId = users[0]?.user_id;

  const handleSubmit = (formData) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser._id, data: formData });
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage title="Lỗi khi tải danh sách users" message={error.message} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <User className="w-8 h-8 mr-3" />
            Quản lý Users
          </h1>
          <p className="text-gray-600 mt-1">
            Danh sách người dùng trong hệ thống MongoDB + Neo4j
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm User
        </button>
      </div>

      <UserStatsGrid users={users} />
      
      <UserList 
        users={users}
        currentUserId={currentUserId}
        onEdit={setEditingUser}
        onDelete={(id) => deleteUserMutation.mutate(id)}
      />

      <Modal
        isOpen={showForm || !!editingUser}
        onClose={handleClose}
        title={editingUser ? 'Cập nhật User' : 'Tạo User Mới'}
      >
        <UserForm
          user={editingUser}
          onSubmit={handleSubmit}
          isLoading={createUserMutation.isPending || updateUserMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default Users;