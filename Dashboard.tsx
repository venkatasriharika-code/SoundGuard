import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTTS } from "@/hooks/useTTS";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  AlertCircle,
  CheckCircle,
  Volume2,
  History,
  AlertTriangle,
  Gauge,
  TrendingDown,
  TrendingUp,
  Zap,
  Settings,
  Download,
  Plus,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Machine {
  id: number;
  name: string;
  machineType: string;
  location: string;
  status: "healthy" | "caution" | "alert";
  healthScore: number;
  lastAnalyzed: Date;
}

interface TrendData {
  timestamp: Date;
  healthScore: number;
  anomalyCount: number;
}

interface AlertData {
  id: number;
  machineId: number;
  alertType: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  isResolved: boolean;
  createdAt: Date;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [machines, setMachines] = useState<Machine[]>([
    {
      id: 1,
      name: "Textile Loom - Unit A",
      machineType: "Loom",
      location: "Factory Floor 1",
      status: "healthy",
      healthScore: 85,
      lastAnalyzed: new Date(),
    },
    {
      id: 2,
      name: "Spindle Motor - Unit B",
      machineType: "Motor",
      location: "Factory Floor 2",
      status: "caution",
      healthScore: 65,
      lastAnalyzed: new Date(),
    },
    {
      id: 3,
      name: "Pump Assembly - Unit C",
      machineType: "Pump",
      location: "Factory Floor 1",
      status: "alert",
      healthScore: 40,
      lastAnalyzed: new Date(),
    },
  ]);

  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([
    {
      id: 1,
      machineId: 1,
      alertType: "bearing_wear",
      severity: "high",
      message: "Bearing wear detected on Textile Loom - Unit A",
      isResolved: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: 2,
      machineId: 2,
      alertType: "lubrication_needed",
      severity: "medium",
      message: "Lubrication needed on Spindle Motor - Unit B",
      isResolved: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ]);

  const [selectedLanguage, setSelectedLanguage] = useState<"english" | "hindi">("english");
  const { isPlaying, playAdvisory, error: ttsError } = useTTS();
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newMachineForm, setNewMachineForm] = useState({
    name: "",
    machineType: "",
    location: "",
  });
  const [alertThresholds, setAlertThresholds] = useState({
    cautionThreshold: 70,
    alertThreshold: 50,
  });

  const handleSaveThresholds = () => {
    if (alertThresholds.alertThreshold >= alertThresholds.cautionThreshold) {
      alert("Alert threshold must be lower than Caution threshold");
      return;
    }
    setShowSettingsModal(false);
    alert("Alert thresholds updated successfully!");
  }

  const handleAddMachine = () => {
    if (!newMachineForm.name || !newMachineForm.machineType || !newMachineForm.location) {
      alert("Please fill in all fields");
      return;
    }

    const newMachine: Machine = {
      id: Math.max(...machines.map(m => m.id), 0) + 1,
      name: newMachineForm.name,
      machineType: newMachineForm.machineType,
      location: newMachineForm.location,
      status: "healthy",
      healthScore: 75,
      lastAnalyzed: new Date(),
    };

    setMachines([...machines, newMachine]);
    setSelectedMachine(newMachine);
    setShowAddMachineModal(false);
    setNewMachineForm({ name: "", machineType: "", location: "" });
  }

  useEffect(() => {
    if (machines.length > 0 && !selectedMachine) {
      setSelectedMachine(machines[0]);
    }

    // Generate trend data
    const now = Date.now();
    const data = [];
    for (let i = 30; i >= 0; i--) {
      data.push({
        timestamp: new Date(now - i * 24 * 60 * 60 * 1000),
        healthScore: 100 - Math.random() * 20 - i * 0.5,
        anomalyCount: Math.floor(Math.random() * 3),
      });
    }
    setTrendData(data);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 border-green-300";
      case "caution":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "alert":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "caution":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Gauge className="w-5 h-5 text-gray-600" />;
    }
  };

  const playVoiceAdvisory = () => {
    if (selectedMachine) {
      const issueType =
        selectedMachine.status === "alert"
          ? "bearing_wear"
          : selectedMachine.status === "caution"
          ? "lubrication_needed"
          : "normal";
      playAdvisory(issueType, selectedLanguage, 800, 15000);
    }
  };

  const healthDistribution = [
    { name: "Healthy", value: machines.filter((m) => m.status === "healthy").length, fill: "#10B981" },
    { name: "Caution", value: machines.filter((m) => m.status === "caution").length, fill: "#F59E0B" },
    { name: "Alert", value: machines.filter((m) => m.status === "alert").length, fill: "#DC2626" },
  ];

  const avgHealthScore = Math.round(machines.reduce((sum, m) => sum + m.healthScore, 0) / machines.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SoundGuard</h1>
              <p className="text-xs text-slate-400">AI Machine Health Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name || "Operator"}</p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Live
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Machines</p>
                  <p className="text-3xl font-bold text-white">{machines.length}</p>
                </div>
                <Gauge className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Health</p>
                  <p className="text-3xl font-bold text-white">{avgHealthScore}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Alerts</p>
                  <p className="text-3xl font-bold text-white">{alerts.filter((a) => !a.isResolved).length}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Healthy Units</p>
                  <p className="text-3xl font-bold text-white">{machines.filter((m) => m.status === "healthy").length}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-900 to-emerald-800 border-emerald-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-300 text-sm">Est. Savings This Month</p>
                  <p className="text-3xl font-bold text-white">₹2,14,000</p>
                </div>
                <TrendingDown className="w-10 h-10 text-emerald-400 opacity-50" />
              </div>
              <p className="text-xs text-emerald-300 mt-3">Projected savings based on prevented downtime across monitored units</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Machines & Alerts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Machine Grid */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Machines</CardTitle>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowAddMachineModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Machine
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {machines.map((machine) => (
                    <div
                      key={machine.id}
                      onClick={() => setSelectedMachine(machine)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedMachine?.id === machine.id
                          ? "bg-blue-900 border-blue-500"
                          : "bg-slate-700 border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{machine.name}</h3>
                          <p className="text-xs text-slate-400">{machine.machineType}</p>
                        </div>
                        {getStatusIcon(machine.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Health</span>
                          <span className="text-sm font-bold text-white">{machine.healthScore}%</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              machine.healthScore > 70
                                ? "bg-green-500"
                                : machine.healthScore > 40
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${machine.healthScore}%` }}
                          />
                        </div>
                        <Badge className={`${getStatusColor(machine.status)} border`}>
                          {machine.status === "healthy" && "✓ Healthy"}
                          {machine.status === "caution" && "⚠ Caution"}
                          {machine.status === "alert" && "✕ Alert"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Alerts */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.filter((a) => !a.isResolved).length === 0 ? (
                  <p className="text-slate-400 text-sm">No active alerts</p>
                ) : (
                  alerts
                    .filter((a) => !a.isResolved)
                    .map((alert) => (
                      <Alert
                        key={alert.id}
                        className={`border-2 ${
                          alert.severity === "critical"
                            ? "bg-red-900 border-red-600"
                            : alert.severity === "high"
                            ? "bg-orange-900 border-orange-600"
                            : "bg-amber-900 border-amber-600"
                        }`}
                      >
                        <AlertCircle className="h-5 w-5 text-white" />
                        <AlertDescription className="ml-2 text-white">
                          <div className="font-semibold">{alert.message}</div>
                          <p className="text-xs text-slate-300 mt-1">
                            {new Date(alert.createdAt).toLocaleTimeString()}
                          </p>
                        </AlertDescription>
                      </Alert>
                    ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Analytics & Voice Advisory */}
          <div className="space-y-6">
            {/* Health Distribution */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Health Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={healthDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {healthDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Voice Advisory */}
            {selectedMachine && (
              <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    Voice Advisory
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-900 rounded-lg p-4 border border-blue-600">
                    <p className="text-sm text-slate-200 font-medium">
                      {selectedMachine.status === "alert"
                        ? "Bearing wear detected. Repair now to save Rs 14,200 in emergency costs."
                        : selectedMachine.status === "caution"
                        ? "Lubrication needed. Apply lubricant immediately to prevent damage."
                        : "Machine is operating normally. No issues detected."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-200">Language</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["english", "hindi"] as const).map((lang) => (
                        <Button
                          key={lang}
                          onClick={() => setSelectedLanguage(lang)}
                          variant={selectedLanguage === lang ? "default" : "outline"}
                          size="sm"
                          className={
                            selectedLanguage === lang
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "border-slate-600 text-slate-300 hover:bg-slate-700"
                          }
                        >
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={playVoiceAdvisory}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isPlaying}
                  >
                    {isPlaying ? (
                      <>
                        <span className="animate-pulse">▶ Playing...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Play in {selectedLanguage === 'english' ? 'English' : 'Hindi'}
                      </>
                    )}
                  </Button>
                  {ttsError && <p className="text-xs text-red-400 mt-2">Error: {ttsError}</p>}
                </CardContent>
              </Card>
            )}

            {/* Cost of Inaction */}
            {selectedMachine && selectedMachine.status !== "healthy" && (
              <Card className="bg-gradient-to-br from-red-900 to-red-800 border-red-600">
                <CardHeader>
                  <CardTitle className="text-white">Cost of Inaction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900 rounded-lg p-3 border border-green-600 text-center">
                      <p className="text-xs text-slate-400 font-semibold">REPAIR NOW</p>
                      <p className="text-lg font-bold text-green-400">₹800</p>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3 border border-red-600 text-center">
                      <p className="text-xs text-slate-400 font-semibold">IF DELAYED</p>
                      <p className="text-lg font-bold text-red-400">₹15,000</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 text-center">Emergency repair + downtime loss</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Trends Chart */}
        <Card className="bg-slate-800 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">30-Day Health Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#94a3b8"
                  tickFormatter={(date) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="healthScore"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  name="Health Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>

      {/* Add Machine Modal */}
      {showAddMachineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Add New Machine</CardTitle>
              <CardDescription className="text-slate-400">Enter the details for your new machine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300">Machine Name</label>
                <input
                  type="text"
                  placeholder="e.g., Textile Loom - Unit D"
                  value={newMachineForm.name}
                  onChange={(e) => setNewMachineForm({ ...newMachineForm, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Machine Type</label>
                <input
                  type="text"
                  placeholder="e.g., Loom, Motor, Pump"
                  value={newMachineForm.machineType}
                  onChange={(e) => setNewMachineForm({ ...newMachineForm, machineType: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Location</label>
                <input
                  type="text"
                  placeholder="e.g., Factory Floor 1"
                  value={newMachineForm.location}
                  onChange={(e) => setNewMachineForm({ ...newMachineForm, location: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </CardContent>
            <div className="flex gap-3 p-6 border-t border-slate-700">
              <Button
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => {
                  setShowAddMachineModal(false);
                  setNewMachineForm({ name: "", machineType: "", location: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleAddMachine}
              >
                Add Machine
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Alert Threshold Settings</CardTitle>
              <CardDescription className="text-slate-400">Configure machine health alert thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">Caution Threshold</label>
                  <span className="text-lg font-bold text-amber-400">{alertThresholds.cautionThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={alertThresholds.cautionThreshold}
                  onChange={(e) => setAlertThresholds({ ...alertThresholds, cautionThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-xs text-slate-400 mt-2">Machines below this score trigger a caution alert</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">Alert Threshold</label>
                  <span className="text-lg font-bold text-red-400">{alertThresholds.alertThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={alertThresholds.alertThreshold}
                  onChange={(e) => setAlertThresholds({ ...alertThresholds, alertThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <p className="text-xs text-slate-400 mt-2">Machines below this score trigger a critical alert</p>
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-300 mb-2"><span className="font-semibold">Current Configuration:</span></p>
                <div className="space-y-1 text-xs text-slate-400">
                  <p>🟢 Healthy: {alertThresholds.cautionThreshold}% - 100%</p>
                  <p>🟡 Caution: {alertThresholds.alertThreshold}% - {alertThresholds.cautionThreshold - 1}%</p>
                  <p>🔴 Alert: 0% - {alertThresholds.alertThreshold - 1}%</p>
                </div>
              </div>
            </CardContent>
            <div className="flex gap-3 p-6 border-t border-slate-700">
              <Button
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => {
                  setShowSettingsModal(false);
                  setAlertThresholds({ cautionThreshold: 70, alertThreshold: 50 });
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveThresholds}
              >
                Save Settings
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
