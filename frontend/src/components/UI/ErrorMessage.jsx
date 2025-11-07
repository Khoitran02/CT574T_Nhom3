const ErrorMessage = ({ title = "Đã xảy ra lỗi", message }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="text-red-800">
        <h3 className="font-medium">{title}</h3>
        {message && <p className="text-sm mt-1">{message}</p>}
      </div>
    </div>
  );
};

export default ErrorMessage;
