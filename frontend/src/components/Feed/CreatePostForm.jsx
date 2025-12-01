import { useState, useRef, useEffect } from 'react';
import { X, Image, Smile, AtSign, Send } from 'lucide-react';
import { relationshipsAPI } from '../../services/api';

// Emoji picker đơn giản
const COMMON_EMOJIS = [
  '😀', '😂', '❤️', '👍', '🎉', '😍', '🤔', '😢', '😎', '🔥',
  '💯', '✨', '🎈', '🌟', '💪', '👏', '🙏', '💕', '😊', '🥳'
];

const CreatePostForm = ({ onSubmit, onCancel, currentUser }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [mentions, setMentions] = useState([]);
  const [emojis, setEmojis] = useState([]);
  const [mutualFollowers, setMutualFollowers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Lấy danh sách người đang follow
  useEffect(() => {
    if (currentUser?._id) {
      relationshipsAPI.getFollowing(currentUser._id, { limit: 100 })
        .then(response => {
          // response.data = { message, data: [...], pagination }
          const followingList = response.data?.data || [];
          const users = followingList.map(item => item.user);
          setMutualFollowers(users);
        })
        .catch(error => {
          console.error('Error fetching following:', error);
        });
    }
  }, [currentUser]);

  // Xử lý upload ảnh
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      alert('Chỉ được upload tối đa 5 ảnh');
      return;
    }

    setImages([...images, ...files]);

    // Tạo preview
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // Xử lý emoji
  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    setContent(before + emoji + after);
    setEmojis([...emojis, { emoji, position: start }]);
    setShowEmojiPicker(false);
    
    // Focus lại textarea
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 0);
  };

  // Xử lý mention
  const handleContentChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setContent(value);

    // Kiểm tra xem có đang gõ @ không
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Chỉ hiện mention list nếu không có space sau @
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase());
        setMentionPosition(lastAtIndex);
        setShowMentionList(true);
        
        // Filter users
        const filtered = mutualFollowers.filter(user => 
          user.name.toLowerCase().includes(textAfterAt.toLowerCase())
        );
        setFilteredUsers(filtered);
      } else {
        setShowMentionList(false);
      }
    } else {
      setShowMentionList(false);
    }
  };

  const selectMention = (user) => {
    const textarea = textareaRef.current;
    const before = content.substring(0, mentionPosition);
    const after = content.substring(textarea.selectionStart);
    const mentionText = `@${user.name} `;
    
    setContent(before + mentionText + after);
    setMentions([...mentions, { 
      userId: user.id, 
      username: user.name, 
      position: mentionPosition 
    }]);
    setShowMentionList(false);
    
    // Focus lại textarea
    setTimeout(() => {
      textarea.focus();
      const newPosition = mentionPosition + mentionText.length;
      textarea.selectionStart = textarea.selectionEnd = newPosition;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) {
      alert('Vui lòng nhập nội dung hoặc chọn ảnh');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('author', currentUser.name);
      formData.append('userId', currentUser._id);
      formData.append('mentions', JSON.stringify(mentions));
      formData.append('emojis', JSON.stringify(emojis));
      
      images.forEach(image => {
        formData.append('images', image);
      });

      await onSubmit(formData);
      
      // Reset form
      setContent('');
      setImages([]);
      setImagePreviews([]);
      setMentions([]);
      setEmojis([]);
    } catch (error) {
      console.error('Error submitting post:', error);
      alert('Có lỗi xảy ra khi đăng bài');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Bạn đang nghĩ gì? (Dùng @ để mention người follow chéo)"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows="5"
        />
        
        {/* Mention suggestion list */}
        {showMentionList && filteredUsers.length > 0 && (
          <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => selectMention(user)}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image previews */}
      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-10 gap-2">
            {COMMON_EMOJIS.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="text-2xl hover:bg-gray-200 rounded p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Thêm ảnh (tối đa 5)"
          >
            <Image className="w-5 h-5" />
            <span className="text-sm">Ảnh</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Thêm emoji"
          >
            <Smile className="w-5 h-5" />
            <span className="text-sm">Emoji</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              const textarea = textareaRef.current;
              const start = textarea.selectionStart;
              const before = content.substring(0, start);
              const after = content.substring(start);
              setContent(before + '@' + after);
              setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + 1;
              }, 0);
            }}
            className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Mention người follow chéo"
          >
            <AtSign className="w-5 h-5" />
            <span className="text-sm">Mention</span>
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading || (!content.trim() && images.length === 0)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Đang đăng...' : 'Đăng bài'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        className="hidden"
      />
    </form>
  );
};

export default CreatePostForm;
