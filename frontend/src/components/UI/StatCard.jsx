const StatCard = ({ icon: Icon, iconColor, value, label }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center">
        {Icon && <Icon className={`w-8 h-8 ${iconColor}`} />}
        <div className="ml-4">
          <h3 className="text-lg font-semibold">{value}</h3>
          <p className="text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
