const UserStats = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="font-bold text-gray-900 mb-3">Thống kê</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Đang theo dõi</span>
          <span className="font-semibold">{stats.followingCount || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Người theo dõi</span>
          <span className="font-semibold">{stats.followersCount || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default UserStats;
