import { Database, Server, Users, FileText } from 'lucide-react';

const Home = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Social Network Database Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Demonstrating MongoDB Sharded Cluster + Neo4j Graph Database 
          for a scalable social network application
        </p>
      </div>

      {/* Architecture Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Database className="w-6 h-6 mr-2" />
          Kiến trúc Database
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              MongoDB Sharded Cluster
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>• 3 Config Servers (High Availability)</li>
              <li>• 3 Shards cho data distribution</li>
              <li>• 1 mongos router</li>
              <li>• Lưu trữ: Users, Posts, Comments</li>
            </ul>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Neo4j Graph Database
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>• User nodes và relationships</li>
              <li>• FOLLOWS relationships</li>
              <li>• FRIENDS relationships</li>
              <li>• Social network visualization</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Quản lý Users
          </h3>
          <p className="text-gray-600">
            CRUD operations với MongoDB, đồng bộ với Neo4j nodes
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Posts & Comments
          </h3>
          <p className="text-gray-600">
            Sharded data distribution cho scalability
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Server className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Social Network
          </h3>
          <p className="text-gray-600">
            Graph relationships với Neo4j visualization
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-6 text-white">
        <h2 className="text-2xl font-semibold mb-4">Project Status</h2>
        <div className="grid md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold">7</div>
            <div className="text-blue-100">MongoDB Processes</div>
          </div>
          <div>
            <div className="text-3xl font-bold">1</div>
            <div className="text-blue-100">Neo4j Instance</div>
          </div>
          <div>
            <div className="text-3xl font-bold">3</div>
            <div className="text-blue-100">Shards Active</div>
          </div>
          <div>
            <div className="text-3xl font-bold">✅</div>
            <div className="text-blue-100">System Ready</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;