import CommentItem from './CommentItem';

const CommentList = ({ comments, onReply, currentUser, postId }) => {
  if (comments.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CommentItem
          key={comment._id}
          comment={comment}
          onReply={onReply}
          currentUser={currentUser}
          postId={postId}
        />
      ))}
    </div>
  );
};

export default CommentList;
