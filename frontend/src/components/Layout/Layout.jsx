import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import ProtectedAdminRoute from '../Auth/ProtectedAdminRoute';

const Layout = () => {
  return (
    <ProtectedAdminRoute>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </ProtectedAdminRoute>
  );
};

export default Layout;