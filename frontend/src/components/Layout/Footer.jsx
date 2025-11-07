const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-gray-500">
          CT574T - Nhóm 3 - MongoDB Sharded Cluster + Neo4j © {currentYear}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
