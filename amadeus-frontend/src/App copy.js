// App.js - Clean version with donut + improved time-series line chart
// Fixed: much better label spacing & readability in line chart
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Shield, Activity, AlertTriangle, CheckCircle, Search, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend as RechartsLegend,
} from 'recharts';

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
  const [logs, setLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);

  // Fixed relative time – treats backend timestamp as UTC
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "—";

    let isoString = timestamp;
    if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
      isoString = timestamp + 'Z';
    }

    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "invalid time";

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins <= 0) return "just now";
    if (diffMins < 2) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;

    const hours = Math.round(diffMins / 60);
    if (hours < 2) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get('/logs/');
      const logsData = res.data;

      setAllLogs(logsData);

      const displayLogs = logsData
        .slice(0, 20)
        .map(log => ({
          id: log.id,
          user: log.user_id,
          status: log.risk_score,
          time: getRelativeTime(log.timestamp),
          rawTime: log.timestamp,
        }));

      setLogs(displayLogs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  }, []);

  useEffect(() => {
    fetchLogs();

    const interval = setInterval(fetchLogs, 5000);

    const timeUpdateInterval = setInterval(() => {
      setLogs(prev => [...prev]);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(timeUpdateInterval);
    };
  }, [fetchLogs]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/analyze/', formData);
      setResult(response.data);
      await fetchLogs();
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Error: Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const totalScans = allLogs.length;
  const anomalyCount = allLogs.filter(log => log.is_anomaly).length;
  const safeCount = totalScans - anomalyCount;
  const anomalyPercentage = totalScans > 0 ? Math.round((anomalyCount / totalScans) * 100) : 0;

  const pieData = [
    { name: 'Anomalies', value: anomalyCount, fill: '#ef4444' },
    { name: 'Safe', value: safeCount, fill: '#22c55e' },
  ];

  const timeSeriesData = [...allLogs]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-50)
    .map((log, index) => ({
      scan: index + 1,
      value: log.value_metric,
      isAnomaly: log.is_anomaly,
    }));

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-1 bg-red-500/20 border border-red-500/50 rounded-full animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs font-bold text-red-400">LIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">Amadeus</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-400">System Active</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* STATS + DONUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Scans" value={totalScans} icon={<Search size={20} className="text-blue-400" />} />
          <StatCard title="Threats Detected" value={anomalyCount} icon={<AlertTriangle size={20} className="text-red-400" />} />

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity size={18} className="text-indigo-400" />
              Anomaly Rate
            </h3>
            {totalScans === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-slate-500">No scans yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} scans`} />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-4xl font-bold fill-white"
                    >
                      {anomalyPercentage}%
                    </text>
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-slate-400">Anomalies ({anomalyCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-slate-400">Safe ({safeCount})</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SIMULATOR + LIVE LOGS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* SIMULATOR */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search size={18} className="text-indigo-400" />
              Anomaly Simulator
            </h2>

            <form onSubmit={handleAnalyze} className="space-y-4">
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
                <label className="block text-xs font-medium text-slate-400 mb-1">Hour of Day (0-24)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  value={formData.hour_of_day}
                  onChange={e => setFormData({...formData, hour_of_day: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Value Metric</label>
                <input
                  type="number"
                  value={formData.value_metric}
                  onChange={e => setFormData({...formData, value_metric: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Scan for Anomalies"}
              </button>
            </form>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-xl border ${result.is_anomaly ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}
              >
                <div className="flex items-center gap-3">
                  {result.is_anomaly ? <AlertTriangle className="text-red-500" size={24} /> : <CheckCircle className="text-green-500" size={24} />}
                  <div>
                    <h3 className={`font-bold ${result.is_anomaly ? 'text-red-400' : 'text-green-400'}`}>
                      {result.risk_score || (result.is_anomaly ? 'Critical' : 'Safe')}
                    </h3>
                    <p className="text-sm text-slate-300">{result.message}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* LIVE LOGS */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Server size={18} className="text-indigo-400" />
              Live Activity Log
            </h2>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
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
                    <span className="text-xs text-slate-500 font-medium">{log.time}</span>
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

        {/* TIME-SERIES LINE CHART – improved spacing */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-6 text-center text-indigo-300">
            Anomaly Time Series
          </h2>
          <p className="text-center text-slate-400 mb-8">
            Value metric over recent scans. Red dots = anomalies, green = safe.
          </p>

          {allLogs.length === 0 ? (
            <div className="h-96 flex items-center justify-center text-slate-500 text-lg">
              Perform scans to see the time series
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={450}>
              <LineChart 
                data={timeSeriesData} 
                margin={{ top: 20, right: 50, left: 40, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                
                <XAxis 
                  dataKey="scan" 
                  label={{ 
                    value: 'Scan Number (Recent 50)', 
                    position: 'insideBottomRight', 
                    offset: -10,
                    style: { fill: '#94a3b8', fontSize: 13 }
                  }}
                  tick={{ 
                    fontSize: 10, 
                    fill: '#94a3b8',
                    angle: -60,
                    textAnchor: 'end',
                    dx: -8,
                    dy: 8
                  }}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                  interval="preserveStartEnd"
                  height={90}           // more space for rotated labels
                />
                
                <YAxis 
                  label={{ 
                    value: 'Value Metric', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: -15,
                    style: { fill: '#94a3b8', fontSize: 13 }
                  }}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(value) => value.toLocaleString()}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                />
                
                <Tooltip 
                  formatter={(value) => Number(value).toLocaleString()}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '13px'
                  }}
                />
                
                <RechartsLegend 
                  verticalAlign="top" 
                  height={40}
                  wrapperStyle={{ 
                    paddingTop: 0,
                    fontSize: '13px'
                  }}
                />

                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ r: 5, fill: (entry) => entry.isAnomaly ? '#ef4444' : '#22c55e', stroke: 'none' }}
                  activeDot={{ r: 7, stroke: '#6366f1', strokeWidth: 2 }}
                  name="Value Metric"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </main>
    </div>
  );
}

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