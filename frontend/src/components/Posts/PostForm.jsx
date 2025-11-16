import { useState } from 'react';

const PostForm = ({ post, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    author: post?.author || '',
    tags: post?.tags?.join(', ') || '',
    isPublished: post?.isPublished ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };
    onSubmit(dataToSubmit);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
          Tiêu đề
        </label>
        <input
          type="text"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
          Nội dung
        </label>
        <textarea
          required
          rows={6}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
          Tác giả
        </label>
        <input
          type="text"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.author}
          onChange={(e) => handleChange('author', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
          Tags (ngăn cách bằng dấu phẩy)
        </label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.tags}
          onChange={(e) => handleChange('tags', e.target.value)}
          placeholder="react, mongodb, nodejs"
        />
      </div>

      <div>
        <label className="flex items-center text-left">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            checked={formData.isPublished}
            onChange={(e) => handleChange('isPublished', e.target.checked)}
          />
          <span className="ml-2 text-sm text-gray-700">Xuất bản ngay</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Đang lưu...' : (post ? 'Cập nhật' : 'Tạo mới')}
        </button>
      </div>
    </form>
  );
};

export default PostForm;
