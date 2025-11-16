import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, Key } from 'lucide-react';
import { authAPI } from '../services/api';

const AdminSettings = () => {
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => {
      setSuccess('Đổi mật khẩu thành công!');
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
      setSuccess('');
    },
  });

  const handleChangePassword = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cài đặt Admin</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Đổi mật khẩu</h2>
            <p className="text-gray-600">Cập nhật mật khẩu cho tài khoản {currentUser.username}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              <Key className="w-4 h-4 inline mr-1" />
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={passwordFormData.currentPassword}
              onChange={(e) =>
                setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              <Key className="w-4 h-4 inline mr-1" />
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={passwordFormData.newPassword}
              onChange={(e) =>
                setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })
              }
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              <Key className="w-4 h-4 inline mr-1" />
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={passwordFormData.confirmPassword}
              onChange={(e) =>
                setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })
              }
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {changePasswordMutation.isPending ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
