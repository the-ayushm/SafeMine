"use client"
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, CheckCircle, XCircle, Bell, TrendingUp, Download, Settings } from 'lucide-react';

const GasMonitoringDashboard = () => {
  const [currentData, setCurrentData] = useState({
    methane: 0,
    carbonMonoxide: 0,
    hydrogenSulfide: 0,
    timestamp: new Date()
  });

  type HistoricalPoint = {
    time: string;
    methane: number;
    co: number;
    h2s: number;
  };

  type AlertItem = {
    id: string | number;
    type: 'danger' | 'warning';
    gas: string;
    value: string;
    message: string;
    timestamp: Date;
  };

  type Prediction = {
    trend: string;
    change: string;
    methane: string;
    carbonMonoxide: string;
    hydrogenSulfide: string;
  };

  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Gas safety thresholds
  const thresholds = {
    methane: { safe: 1.0, warning: 2.5, danger: 5.0, unit: '%' },
    carbonMonoxide: { safe: 25, warning: 50, danger: 100, unit: 'ppm' },
    hydrogenSulfide: { safe: 5, warning: 10, danger: 20, unit: 'ppm' }
  };

  // Simulate real-time gas data
  useEffect(() => {
    const interval = setInterval(async () => {
    const res = await fetch("/api/gasdata", { cache: "no-store" });
    const data = await res.json();
      const newData = {
        methane: data.mq2 / 100.0,
        carbonMonoxide: data.mq7 / 10.0,
        hydrogenSulfide: Math.random() * 10,
        timestamp: new Date()
      };

      setCurrentData(newData);

      // Add to historical data
      setHistoricalData(prev => {
        const updated = [...prev, {
          time: newData.timestamp.toLocaleTimeString(),
          methane: parseFloat(newData.methane.toFixed(2)),
          co: parseFloat(newData.carbonMonoxide.toFixed(2)),
          h2s: parseFloat(newData.hydrogenSulfide.toFixed(2))
        }];
        return updated.slice(-20); // Keep last 20 readings
      });

      // Check for alerts
      checkAlerts(newData);

      // Generate prediction
      generatePrediction(newData);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  interface GasData {
    methane: number;
    carbonMonoxide: number;
    hydrogenSulfide: number;
    timestamp: Date;
  }

  type GasKey = keyof typeof thresholds;

  const checkAlerts = (data: GasData): void => {
    const newAlerts: AlertItem[] = [];
    
    (Object.keys(thresholds) as GasKey[]).forEach(gas => {
      const value = data[gas as keyof GasData] as number;
      const threshold = thresholds[gas];
      
      if (value >= threshold.danger) {
        newAlerts.push({
          id: Date.now() + gas,
          type: 'danger',
          gas: gas,
          value: value.toFixed(2),
          message: `DANGER: ${gas.toUpperCase()} level critical!`,
          timestamp: new Date()
        });
      } else if (value >= threshold.warning) {
        newAlerts.push({
          id: Date.now() + gas,
          type: 'warning',
          gas: gas,
          value: value.toFixed(2),
          message: `WARNING: ${gas.toUpperCase()} level elevated`,
          timestamp: new Date()
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
    }
  };

  const generatePrediction = (data: GasData) => {
    // Simple prediction based on current trend
    const trend = Math.random() > 0.5 ? 'increasing' : 'decreasing';
    const change = Math.random() * 20 - 10; // numeric percent change
    
    setPrediction({ 
      trend,
      change: change.toFixed(1),
      methane: (data.methane * (1 + change / 100)).toFixed(2),
      carbonMonoxide: (data.carbonMonoxide * (1 + change / 100)).toFixed(2),
      hydrogenSulfide: (data.hydrogenSulfide * (1 + change / 100)).toFixed(2)
    });
  };

  type Status = 'safe' | 'warning' | 'danger';

  interface GetStatusFn {
    (value: number, gas: GasKey): Status;
  }

  const getStatus: GetStatusFn = (value, gas) => {
    const threshold = thresholds[gas];
    if (value >= threshold.danger) return 'danger';
    if (value >= threshold.warning) return 'warning';
    return 'safe';
  };

  interface StatusCardProps {
    gas: GasKey;
    value: number;
    label: string;
  }

  const StatusCard: React.FC<StatusCardProps> = ({ gas, value, label }) => {
    const status = getStatus(value, gas);
    const threshold = thresholds[gas];
    
    const statusConfig = {
      safe: { icon: CheckCircle, color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50' },
      warning: { icon: AlertTriangle, color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      danger: { icon: XCircle, color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50' }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <div className={`${config.bgColor} rounded-lg p-6 border-2 ${status === 'danger' ? 'border-red-500 animate-pulse' : 'border-transparent'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
          <Icon className={`w-6 h-6 ${config.textColor}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">{value.toFixed(2)}</span>
          <span className="text-xl text-gray-800">{threshold.unit}</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
          <span className={`text-sm font-medium ${config.textColor} uppercase`}>{status}</span>
        </div>
        <div className="mt-3 text-sm text-gray-800">
           Safe: &lt;{threshold.safe} | Warning: {threshold.warning} | Danger: {threshold.danger}+
        </div>
      </div>
    );
  };

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard gas="methane" value={currentData.methane} label="Methane (CH₄)" />
        <StatusCard gas="carbonMonoxide" value={currentData.carbonMonoxide} label="Carbon Monoxide (CO)" />
        <StatusCard gas="hydrogenSulfide" value={currentData.hydrogenSulfide} label="Hydrogen Sulfide (H₂S)" />
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Historical Gas Levels</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="methane" stroke="#10b981" name="Methane (%)" strokeWidth={2} />
            <Line type="monotone" dataKey="co" stroke="#f59e0b" name="CO (ppm)" strokeWidth={2} />
            <Line type="monotone" dataKey="h2s" stroke="#ef4444" name="H₂S (ppm)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">Prediction (Next Hour)</h3>
          </div>
          {prediction && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <span className="font-medium text-gray-800">Trend:</span>
                <span className={`font-bold ${prediction.trend === 'increasing' ? 'text-red-600' : 'text-green-600'}`}>
                  {prediction.trend.toUpperCase()} ({prediction.change}%)
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-800">Methane:</span>
                  <span className="font-semibold text-gray-900">{prediction.methane}%</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-800">CO:</span>
                  <span className="font-semibold text-gray-900">{prediction.carbonMonoxide} ppm</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-800">H₂S:</span>
                  <span className="font-semibold text-gray-900">{prediction.hydrogenSulfide} ppm</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-800">Recent Alerts</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-gray-700 text-center py-4">No alerts - All systems normal</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={`p-3 rounded ${alert.type === 'danger' ? 'bg-red-100 border-l-4 border-red-500 text-red-900' : 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900'}`}>
                  <div className="flex items-start gap-2">
                    {alert.type === 'danger' ? (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{alert.message}</p>
                      <p className="text-xs mt-1 text-current">
                         Value: {alert.value} | {alert.timestamp.toLocaleTimeString()}
                       </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const AnalyticsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Gas Concentration Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="methane" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Methane (%)" />
            <Area type="monotone" dataKey="co" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="CO (ppm)" />
            <Area type="monotone" dataKey="h2s" stackId="3" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="H₂S (ppm)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="font-semibold text-gray-700 mb-3">Average Levels (Last 20 readings)</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className='text-black'>Methane:</span>
              <span className="font-bold text-black">{(historicalData.reduce((acc, d) => acc + d.methane, 0) / historicalData.length || 0).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className='text-black'>CO:</span>
              <span className="font-bold text-black">{(historicalData.reduce((acc, d) => acc + d.co, 0) / historicalData.length || 0).toFixed(2)} ppm</span>
            </div>
            <div className="flex justify-between">
              <span className='text-black'>H₂S:</span>
              <span className="font-bold text-black">{(historicalData.reduce((acc, d) => acc + d.h2s, 0) / historicalData.length || 0).toFixed(2)} ppm</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="font-semibold text-gray-700 mb-3">Peak Levels</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className='text-black'>Methane:</span>
              <span className="font-bold text-red-600">{Math.max(...historicalData.map(d => d.methane), 0).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className='text-black'>CO:</span>
              <span className="font-bold text-red-600">{Math.max(...historicalData.map(d => d.co), 0).toFixed(2)} ppm</span>
            </div>
            <div className="flex justify-between">
              <span className='text-black'>H₂S:</span>
              <span className="font-bold text-red-600">{Math.max(...historicalData.map(d => d.h2s), 0).toFixed(2)} ppm</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="font-semibold text-gray-700 mb-3">Safety Status</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className='text-black'>Total Alerts:</span>
              <span className="font-bold text-black">{alerts.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className='text-black'>Danger Alerts:</span>
              <span className="font-bold text-red-600">{alerts.filter(a => a.type === 'danger').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className='text-black'>Warning Alerts:</span>
              <span className="font-bold text-yellow-600">{alerts.filter(a => a.type === 'warning').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ReportsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Gas Monitoring Reports</h3>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3 text-gray-700">Report Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className='text-black'>Monitoring Period:</span>
                <span className="font-medium text-black">Last 24 Hours</span>
              </div>
              <div className="flex justify-between">
                <span className='text-black'>Total Readings:</span>
                <span className="font-medium text-black">{historicalData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className='text-black'>Alert Count:</span>
                <span className="font-medium text-black">{alerts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className='text-black'>Status:</span>
                <span className="font-medium text-green-600">Operational</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3 text-gray-700">Safety Compliance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className='text-black'>Methane Compliance:</span>
                <span className="font-medium text-green-600">98%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className='text-black'>CO Compliance:</span>
                <span className="font-medium text-green-600">95%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className='text-black'>H₂S Compliance:</span>
                <span className="font-medium text-yellow-600">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className='text-black'>Overall:</span>
                <span className="font-medium text-green-600">95%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Gas Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Level</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {alerts.slice(0, 10).map((alert, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-black">{alert.timestamp.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-medium text-black">{alert.gas.toUpperCase()}</td>
                  <td className="px-4 py-3 text-sm text-black">{alert.value}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-black ${alert.type === 'danger' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {alert.type.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Mining Gas Monitoring System</h1>
              <p className="text-blue-100">Real-time safety monitoring for mining environments</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-blue-100 text-sm">Last Updated</p>
                <p className="text-white font-semibold">{currentData.timestamp.toLocaleTimeString()}</p>
              </div>
              <Settings className="w-8 h-8 text-white cursor-pointer hover:rotate-90 transition-transform" />
            </div>
          </div>
        </header>

        <nav className="bg-white rounded-lg shadow-lg mb-6 p-2">
          <div className="flex gap-2">
            {['dashboard', 'analytics', 'reports'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </nav>

        <main>
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'reports' && <ReportsView />}
        </main>

        <footer className="mt-6 text-center text-gray-400 text-sm">
          <p>© 2024 Mining Safety System | Real-time Gas Detection & Monitoring</p>
        </footer>
      </div>
    </div>
  );
};

export default GasMonitoringDashboard;