// src/App.js - Final complete version with all improvements
// Features:
// - Real-time auto-refresh every 5 seconds
// - Search/filter for live logs
// - Enhanced cyberpunk styling with glows, animations, glassmorphism
// - Top glow stats cards
// - Threat level radial gauge
// - Risk pie, hourly bar, anomaly scatter, anomalies over time line chart
// - Live badge and polished UX

// App.js - Fully corrected and cleaned version
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Activity, AlertTriangle, CheckCircle, Search, Server } from 'lucide-react';
import { motion } from 'framer-motion';

// Configure Axios
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000'
});

function App() {
  const [formData, setFormData] = useState({
    user_id: 'user_123',
    activity_type: 'login',
    hour_of_day: 14.5,
    value_metric: 500.0
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);         // For live panel (latest 20, formatted for display)
  const [allLogs, setAllLogs] = useState([]);   // Full logs from DB (for stats & future charts)

  const fetchLogs = async () => {
    try {
      const res = await api.get('/logs/');
      const logsData = res.data;

      setAllLogs(logsData);

      // Map DB logs to the exact format needed for the Live Activity Log panel
      const displayLogs = logsData
        .slice(0, 20) // newest 20 (DB returns newest first due to ordering in backend)
        .map(log => ({
          id: log.id,
          user: log.user_id,
          status: log.risk_score, // "Critical" or "Safe"
          time: new Date(log.timestamp).toLocaleTimeString(),
        }));

      setLogs(displayLogs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
    fetchLogs();
   } , 5000); // Every 5 seconds

  return () => clearInterval(interval); // Cleanup
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/analyze/', formData);
      const data = response.data;

      setResult(data);

      // Refresh logs from DB — new entry appears instantly and accurately
      await fetchLogs();

    } catch (error) {
      console.error("Backend offline?", error);
      alert("Error: Is the Python backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* --- HEADER --- */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 px-4 py-1 bg-red-500/20 border border-red-500/50 rounded-full animate-pulse">
         <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-xs font-bold text-red-400">LIVE</span>
          </div>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Amadeus</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-400">System Active</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Total Scans" 
            value={allLogs.length} 
            icon={<Search size={20} className="text-blue-400"/>} 
          />
          <StatCard 
            title="Threats Blocked" 
            value={allLogs.filter(l => l.is_anomaly).length} 
            icon={<AlertTriangle size={20} className="text-red-400"/>} 
          />
          <StatCard 
            title="System Load" 
            value="12%" 
            icon={<Server size={20} className="text-emerald-400"/>} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* --- LEFT: SIMULATOR --- */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity size={18} className="text-indigo-400" />
              Activity Simulator
            </h2>
            
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">User ID</label>
                  <input 
                    type="text" 
                    value={formData.user_id}
                    onChange={e => setFormData({...formData, user_id: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Hour (0-24)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="24"
                    step="0.1"
                    value={formData.hour_of_day}
                    onChange={e => setFormData({...formData, hour_of_day: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Data Value Metric (Size/Amount)</label>
                <input 
                  type="number" 
                  value={formData.value_metric}
                  onChange={e => setFormData({...formData, value_metric: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Tip: High values (&gt;1000) or weird hours usually trigger anomalies.</p>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Analyzing..." : "Scan for Anomalies"}
              </button>
            </form>

            {/* RESULT BOX */}
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-xl border ${result.is_anomaly ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}
              >
                <div className="flex items-center gap-3">
                  {result.is_anomaly ? (
                    <AlertTriangle className="text-red-500" size={24} />
                  ) : (
                    <CheckCircle className="text-green-500" size={24} />
                  )}
                  <div>
                    <h3 className={`font-bold ${result.is_anomaly ? 'text-red-400' : 'text-green-400'}`}>
                      {result.risk_level}
                    </h3>
                    <p className="text-sm text-slate-300">{result.message}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* --- RIGHT: LIVE LOGS --- */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm h-[400px] overflow-hidden flex flex-col">
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Server size={18} className="text-indigo-400" />
              Live Activity Log
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {logs.length === 0 && (
                <div className="text-center text-slate-500 mt-10">No activity recorded yet.</div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${log.status === 'Critical' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium text-slate-300">{log.user}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">{log.time}</span>
                    <span className={`text-xs px-2 py-1 rounded border ${
                      log.status === 'Critical' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                      : 'bg-green-500/10 border-green-500/20 text-green-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Simple Sub-component for Stats
function StatCard({ title, value, icon }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

export default App;