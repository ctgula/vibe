'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Admin dashboard for managing Supabase operations
export default function AdminDashboard() {
  const router = useRouter();
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [activeGuests, setActiveGuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch active rooms
      const roomsResponse = await fetch('/api/mcp/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: `
            SELECT r.id, r.name, r.created_at, 
                  COUNT(DISTINCT rp.user_id) as participant_count,
                  COUNT(DISTINCT rm.id) as message_count
            FROM rooms r
            LEFT JOIN room_participants rp ON r.id = rp.room_id AND rp.is_active = true
            LEFT JOIN room_messages rm ON r.id = rm.room_id
            WHERE r.is_active = true
            GROUP BY r.id, r.name, r.created_at
            ORDER BY r.created_at DESC
            LIMIT 20
          `
        })
      });
      
      const roomsData = await roomsResponse.json();
      
      // Fetch active guests
      const guestsResponse = await fetch('/api/mcp/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: `
            SELECT p.id, p.username, p.display_name, p.created_at,
                  COUNT(DISTINCT rp.room_id) as room_count
            FROM profiles p
            LEFT JOIN room_participants rp ON p.id = rp.user_id AND rp.is_active = true
            WHERE p.is_guest = true
            GROUP BY p.id, p.username, p.display_name, p.created_at
            ORDER BY room_count DESC, p.created_at DESC
            LIMIT 20
          `
        })
      });
      
      const guestsData = await guestsResponse.json();
      
      setActiveRooms(roomsData.data || []);
      setActiveGuests(guestsData.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute a custom SQL query
  const executeCustomSql = async () => {
    if (!sqlQuery.trim()) {
      toast.error('Please enter a SQL query');
      return;
    }
    
    try {
      setSqlResult(null);
      setIsLoading(true);
      
      const response = await fetch('/api/mcp/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: sqlQuery
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        toast.error(`SQL Error: ${result.error}`);
      } else {
        toast.success('SQL executed successfully');
        setSqlResult(result.data);
      }
    } catch (error) {
      console.error('Error executing SQL:', error);
      toast.error('Failed to execute SQL');
    } finally {
      setIsLoading(false);
    }
  };

  // Run a maintenance script
  const runMaintenanceScript = async (scriptName: string) => {
    try {
      setIsLoading(true);
      toast.loading(`Running ${scriptName}...`);
      
      const response = await fetch('/api/admin/run-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptName
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        toast.error(`Error: ${result.error}`);
      } else {
        toast.success(`${scriptName} completed: ${result.message}`);
        // Refresh dashboard data after script runs
        fetchDashboardData();
      }
    } catch (error) {
      console.error(`Error running ${scriptName}:`, error);
      toast.error(`Failed to run ${scriptName}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button 
          className={`px-4 py-2 ${activeTab === 'dashboard' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'maintenance' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          Maintenance
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'sql' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('sql')}
        >
          SQL Console
        </button>
      </div>
      
      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Rooms */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Active Rooms ({activeRooms.length})</h2>
              {isLoading ? (
                <p>Loading rooms...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Participants</th>
                        <th className="px-4 py-2 text-left">Messages</th>
                        <th className="px-4 py-2 text-left">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRooms.map(room => (
                        <tr key={room.id} className="border-t">
                          <td className="px-4 py-2">{room.name}</td>
                          <td className="px-4 py-2">{room.participant_count}</td>
                          <td className="px-4 py-2">{room.message_count}</td>
                          <td className="px-4 py-2">{new Date(room.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Active Guests */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Active Guests ({activeGuests.length})</h2>
              {isLoading ? (
                <p>Loading guests...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Username</th>
                        <th className="px-4 py-2 text-left">Display Name</th>
                        <th className="px-4 py-2 text-left">Rooms</th>
                        <th className="px-4 py-2 text-left">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeGuests.map(guest => (
                        <tr key={guest.id} className="border-t">
                          <td className="px-4 py-2">{guest.username}</td>
                          <td className="px-4 py-2">{guest.display_name}</td>
                          <td className="px-4 py-2">{guest.room_count}</td>
                          <td className="px-4 py-2">{new Date(guest.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={fetchDashboardData}
              disabled={isLoading}
            >
              Refresh Data
            </button>
          </div>
        </div>
      )}
      
      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Maintenance Operations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border p-4 rounded">
              <h3 className="font-bold mb-2">Data Cleanup</h3>
              <p className="text-sm mb-4">Remove old or unused data from the database.</p>
              <div className="flex flex-col space-y-2">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={() => runMaintenanceScript('cleanup-old-messages')}
                  disabled={isLoading}
                >
                  Clean Up Old Messages
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={() => runMaintenanceScript('cleanup-empty-rooms')}
                  disabled={isLoading}
                >
                  Remove Empty Rooms
                </button>
              </div>
            </div>
            
            <div className="border p-4 rounded">
              <h3 className="font-bold mb-2">Data Seeding</h3>
              <p className="text-sm mb-4">Add test data to the database.</p>
              <div className="flex flex-col space-y-2">
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  onClick={() => runMaintenanceScript('seed-guest-users')}
                  disabled={isLoading}
                >
                  Seed Guest Users
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  onClick={() => runMaintenanceScript('insert-sample-messages')}
                  disabled={isLoading}
                >
                  Insert Sample Messages
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  onClick={() => runMaintenanceScript('seed-demo-mode')}
                  disabled={isLoading}
                >
                  Setup Demo Mode
                </button>
              </div>
            </div>
            
            <div className="border p-4 rounded">
              <h3 className="font-bold mb-2">Real-time Simulation</h3>
              <p className="text-sm mb-4">Simulate user activity in the app.</p>
              <div className="flex flex-col space-y-2">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={() => runMaintenanceScript('simulate-room-activity')}
                  disabled={isLoading}
                >
                  Start Room Activity Simulation
                </button>
                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  onClick={() => runMaintenanceScript('stop-simulation')}
                  disabled={isLoading}
                >
                  Stop All Simulations
                </button>
              </div>
            </div>
            
            <div className="border p-4 rounded">
              <h3 className="font-bold mb-2">Analytics</h3>
              <p className="text-sm mb-4">Update analytics and statistics.</p>
              <div className="flex flex-col space-y-2">
                <button
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  onClick={() => runMaintenanceScript('update-room-analytics')}
                  disabled={isLoading}
                >
                  Update Room Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* SQL Console Tab */}
      {activeTab === 'sql' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">SQL Console</h2>
          
          <div className="mb-4">
            <textarea
              className="w-full h-40 p-2 border rounded font-mono"
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="Enter SQL query here..."
            />
          </div>
          
          <div className="mb-6">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
              onClick={executeCustomSql}
              disabled={isLoading}
            >
              Execute Query
            </button>
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              onClick={() => setSqlQuery('')}
            >
              Clear
            </button>
          </div>
          
          {sqlResult && (
            <div>
              <h3 className="font-bold mb-2">Results:</h3>
              <div className="overflow-x-auto border rounded p-2 bg-gray-50">
                <pre className="whitespace-pre-wrap">{JSON.stringify(sqlResult, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
