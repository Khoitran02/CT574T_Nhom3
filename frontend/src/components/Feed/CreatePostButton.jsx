import { PenSquare } from 'lucide-react';

const CreatePostButton = ({ onClick }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <button
        onClick={onClick}
        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
      >
        <PenSquare className="w-5 h-5" />
        Bạn đang nghĩ gì?
      </button>
    </div>
  );
};

export default CreatePostButton;
