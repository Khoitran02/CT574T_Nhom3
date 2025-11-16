import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user) {
      navigate('/admin/login');
    } else if (user.role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user || user.role !== 'admin') {
    return null;
  }

  return children;
};

export default ProtectedAdminRoute;
