import { useQuery } from '@tanstack/react-query';
import { databaseAPI } from '../services/api';
import { Database, Server, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const DatabaseStatus = () => {
  const {
    data: statusResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['database-status'],
    queryFn: databaseAPI.getStatus,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const status = statusResponse?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">
          <h3 className="font-medium">Không thể kết nối đến server</h3>
          <p className="text-sm mt-1">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Database className="w-8 h-8 mr-3" />
            Database Status
          </h1>
          <p className="text-gray-600 mt-1">
            Trạng thái hệ thống MongoDB Sharded Cluster + Neo4j
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Server className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Server Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Server Information</h2>
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">{status?.status}</span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Project Details</h3>
            <p className="text-gray-600">{status?.project}</p>
            <p className="text-gray-600 mt-1">{status?.message}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Last Updated</h3>
            <p className="text-gray-600">
              {status?.timestamp ? new Date(status.timestamp).toLocaleString('vi-VN') : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Architecture Overview</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">MongoDB Cluster</h3>
            <p className="text-gray-600 text-sm">{status?.architecture?.mongodb}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Neo4j Database</h3>
            <p className="text-gray-600 text-sm">{status?.architecture?.neo4j}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Sharding Status</h3>
            <p className="text-gray-600 text-sm">{status?.architecture?.sharding}</p>
          </div>
        </div>
      </div>

      {/* Database Connections */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Connections</h2>
        <div className="space-y-4">
          {status?.databases?.map((db, index) => (
            <DatabaseCard key={index} database={db} />
          ))}
        </div>
      </div>

      {/* MongoDB Cluster Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">MongoDB Cluster Components</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Config Servers</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• localhost:27019 (Config Server 1)</li>
              <li>• localhost:27020 (Config Server 2)</li>
              <li>• localhost:27021 (Config Server 3)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Shards</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• localhost:27022 (Shard 1)</li>
              <li>• localhost:27023 (Shard 2)</li>
              <li>• localhost:27024 (Shard 3)</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <h3 className="font-medium text-gray-700 mb-2">Router</h3>
          <p className="text-sm text-gray-600">• localhost:27017 (mongos router)</p>
        </div>
      </div>
    </div>
  );
};

// Database Card Component
const DatabaseCard = ({ database }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(database.status)}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">{database.name}</h3>
        <div className="flex items-center">
          {getStatusIcon(database.status)}
          <span className="ml-2 text-sm font-medium capitalize">
            {database.status}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <span className="font-medium">Type:</span> {database.type}
        </div>
        <div>
          <span className="font-medium">URI:</span> {database.uri === 'hidden' ? 'localhost:27017' : database.uri}
        </div>
      </div>

      {database.message && (
        <p className="mt-2 text-sm text-gray-600">{database.message}</p>
      )}
    </div>
  );
};

export default DatabaseStatus;