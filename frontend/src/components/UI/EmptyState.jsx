const EmptyState = ({ icon: Icon, message }) => {
  return (
    <div className="px-6 py-8 text-center text-gray-500">
      {Icon && <Icon className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
      <p>{message}</p>
    </div>
  );
};

export default EmptyState;
