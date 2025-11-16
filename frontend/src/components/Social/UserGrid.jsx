import SocialUserCard from './SocialUserCard';

const UserGrid = ({ users, currentUserId, showFollowButton = true, showViewInfo = true, onViewFollowers, onViewFollowing, onViewUserInfo, emptyMessage }) => {
  if (users.length === 0) {
    return (
      <div className="col-span-full text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {users.map((user) => (
        <SocialUserCard
          key={user.user_id}
          user={user}
          currentUserId={currentUserId}
          showFollowButton={showFollowButton}
          showViewInfo={showViewInfo}
          onViewFollowers={onViewFollowers}
          onViewFollowing={onViewFollowing}
          onViewUserInfo={onViewUserInfo}
        />
      ))}
    </>
  );
};

export default UserGrid;
