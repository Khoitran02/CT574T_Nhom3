import { useState, useRef, useEffect } from 'react';
import { X, Image, Smile, AtSign, Send } from 'lucide-react';
import { relationshipsAPI } from '../../services/api';

// Emoji picker đơn giản
const COMMON_EMOJIS = [
  '😀', '😂', '❤️', '👍', '🎉', '😍', '🤔', '😢', '😎', '🔥',
  '💯', '✨', '🎈', '🌟', '💪', '👏', '🙏', '💕', '😊', '🥳'
];

const CommentForm = ({ onSubmit, placeholder = "Viết bình luận...", currentUser }) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 3) {
      alert('Chỉ được upload tối đa 3 ảnh cho comment');
      return;
    }

    setImages([...images, ...files]);

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

  const insertEmoji = (emoji) => {
    const input = inputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = content;
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    setContent(before + emoji + after);
    setEmojis([...emojis, { emoji, position: start }]);
    setShowEmojiPicker(false);
    
    setTimeout(() => {
      input.focus();
      input.selectionStart = input.selectionEnd = start + emoji.length;
    }, 0);
  };

  const handleContentChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setContent(value);

    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase());
        setMentionPosition(lastAtIndex);
        setShowMentionList(true);
        
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
    const input = inputRef.current;
    const before = content.substring(0, mentionPosition);
    const after = content.substring(input.selectionStart);
    const mentionText = `@${user.name} `;
    
    setContent(before + mentionText + after);
    setMentions([...mentions, { 
      userId: user.id, 
      username: user.name, 
      position: mentionPosition 
    }]);
    setShowMentionList(false);
    
    setTimeout(() => {
      input.focus();
      const newPosition = mentionPosition + mentionText.length;
      input.selectionStart = input.selectionEnd = newPosition;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    setIsSubmitting(true);
    
    try {
      if (images.length > 0 || mentions.length > 0 || emojis.length > 0) {
        // Gửi với FormData nếu có ảnh/mentions/emojis
        const formData = new FormData();
        formData.append('content', content);
        formData.append('mentions', JSON.stringify(mentions));
        formData.append('emojis', JSON.stringify(emojis));
        
        images.forEach(image => {
          formData.append('images', image);
        });
        
        await onSubmit(formData);
      } else {
        // Gửi content đơn giản
        await onSubmit(content);
      }
      
      // Reset form
      setContent('');
      setImages([]);
      setImagePreviews([]);
      setMentions([]);
      setEmojis([]);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={handleContentChange}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && images.length === 0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? '...' : 'Gửi'}
          </button>
        </div>

        {/* Mention suggestion */}
        {showMentionList && filteredUsers.length > 0 && (
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {filteredUsers.slice(0, 5).map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => selectMention(user)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-sm"
              >
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  {user.name[0].toUpperCase()}
                </div>
                <span>{user.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Image previews */}
        {imagePreviews.length > 0 && (
          <div className="flex gap-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="p-2 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-10 gap-1">
              {COMMON_EMOJIS.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="text-lg hover:bg-gray-200 rounded p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Thêm ảnh (tối đa 3)"
          >
            <Image className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Thêm emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => {
              const input = inputRef.current;
              const start = input.selectionStart;
              const before = content.substring(0, start);
              const after = content.substring(start);
              setContent(before + '@' + after);
              setTimeout(() => {
                input.focus();
                input.selectionStart = input.selectionEnd = start + 1;
              }, 0);
            }}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Mention"
          >
            <AtSign className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="hidden"
        />
      </div>
    </form>
  );
};

export default CommentForm;
