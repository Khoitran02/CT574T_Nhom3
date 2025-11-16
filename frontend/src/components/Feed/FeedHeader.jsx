import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FeedHeader = ({ userName }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4 flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-blue-600">Social Network</h1>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-sm sm:text-base text-gray-700 truncate max-w-[100px] sm:max-w-none">
            {userName}
          </span>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-blue-600 hover:bg-blue-50 rounded text-sm sm:text-base"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Trang cá nhân</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default FeedHeader;
