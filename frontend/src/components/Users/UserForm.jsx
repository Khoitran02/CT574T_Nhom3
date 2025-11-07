import { useState } from 'react';

const UserForm = ({ user, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
          Username
        </label>
        <input
          type="text"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.username}
          onChange={(e) => handleChange('username', e.target.value)}
          disabled={!!user}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
          Email
        </label>
        <input
          type="email"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          disabled={!!user}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
          Tên hiển thị
        </label>
        <input
          type="text"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
          Bio
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={formData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Đang lưu...' : (user ? 'Cập nhật' : 'Tạo mới')}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
