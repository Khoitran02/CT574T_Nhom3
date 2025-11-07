import Navigation from './Navigation';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-grow">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;