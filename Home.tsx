import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTTS } from "@/hooks/useTTS";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Volume2, History, AlertTriangle, Gauge } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MachineAlert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  costNow: number;
  costLater: number;
  timestamp: string;
}

interface MachineStatus {
  name: string;
  health: number;
  lastChecked: string;
  status: "healthy" | "caution" | "alert";
}

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [machineStatus, setMachineStatus] = useState<MachineStatus>({
    name: "Textile Loom - Unit A",
    health: 85,
    lastChecked: "2 minutes ago",
    status: "healthy",
  });

  const [alerts, setAlerts] = useState<MachineAlert[]>([
    {
      id: "1",
      type: "warning",
      title: "Bearing Wear Detected",
      description: "Acoustic signature shows early signs of bearing wear on spindle motor.",
      costNow: 800,
      costLater: 15000,
      timestamp: "5 minutes ago",
    },
  ]);

  const { isPlaying, playAdvisory } = useTTS();

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
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "caution":
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case "alert":
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Gauge className="w-6 h-6 text-gray-600" />;
    }
  };

  const playVoiceAdvisory = () => {
    playAdvisory("bearing_wear", "hindi", 800, 15000);
  };

  const simulateNewAlert = () => {
    setMachineStatus(prev => ({
      ...prev,
      health: Math.max(prev.health - 15, 30),
      status: prev.health > 50 ? "caution" : "alert",
      lastChecked: "just now",
    }));
  };

  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/manus-storage/soundguard-logo_8349fb52.png" alt="SoundGuard" className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SoundGuard</h1>
              <p className="text-xs text-slate-500">AI-Powered Machine Health Monitor</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-700">Connected</p>
            <p className="text-xs text-green-600">● Live</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Machine Status & Alerts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Machine Status Card */}
            <Card className="border-2 border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl text-slate-900">{machineStatus.name}</CardTitle>
                    <CardDescription>Last checked: {machineStatus.lastChecked}</CardDescription>
                  </div>
                  {getStatusIcon(machineStatus.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Health Gauge */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">Machine Health</span>
                    <span className="text-2xl font-bold text-slate-900">{machineStatus.health}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        machineStatus.health > 70
                          ? "bg-green-500"
                          : machineStatus.health > 40
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${machineStatus.health}%` }}
                    />
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex gap-2 mb-6">
                  <Badge className={`${getStatusColor(machineStatus.status)} border`}>
                    {machineStatus.status === "healthy" && "✓ Healthy"}
                    {machineStatus.status === "caution" && "⚠ Caution"}
                    {machineStatus.status === "alert" && "✕ Alert"}
                  </Badge>
                </div>

                {/* Demo Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={simulateNewAlert}
                    variant="outline"
                    className="w-full text-slate-700 border-slate-300 hover:bg-slate-100"
                  >
                    Simulate New Alert (for demo)
                  </Button>
                  <Button
                    onClick={goToDashboard}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2"
                  >
                    Go to Professional Dashboard
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/detection-engine'}
                    variant="outline"
                    className="w-full text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    View Detection Engine
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Active Alerts</h2>
                {alerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    className={`border-2 ${
                      alert.type === "critical"
                        ? "bg-red-50 border-red-300"
                        : alert.type === "warning"
                        ? "bg-amber-50 border-amber-300"
                        : "bg-blue-50 border-blue-300"
                    }`}
                  >
                    <AlertCircle
                      className={`h-5 w-5 ${
                        alert.type === "critical"
                          ? "text-red-600"
                          : alert.type === "warning"
                          ? "text-amber-600"
                          : "text-blue-600"
                      }`}
                    />
                    <AlertDescription className="ml-2">
                      <div className="font-semibold text-slate-900">{alert.title}</div>
                      <p className="text-sm text-slate-700 mt-1">{alert.description}</p>
                      <p className="text-xs text-slate-500 mt-2">{alert.timestamp}</p>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Advisory & History */}
          <div className="space-y-6">
            {/* Voice Advisory Card */}
            <Card className="border-2 border-blue-200 bg-blue-50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Voice Advisory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-slate-700 font-medium">"Bearing wear detected on spindle motor. Repair now to save Rs 14,200 in emergency costs."</p>
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
                      Play in Hindi
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Cost of Inaction */}
            <Card className="border-2 border-red-300 bg-red-50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-red-900">Cost of Inaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-red-200 text-center">
                    <p className="text-xs text-slate-500 font-semibold">REPAIR NOW</p>
                    <p className="text-xl font-bold text-green-600">₹800</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-300 text-center">
                    <p className="text-xs text-slate-500 font-semibold">IF DELAYED</p>
                    <p className="text-xl font-bold text-red-600">₹15,000</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 text-center">Emergency repair + downtime loss</p>
              </CardContent>
            </Card>

            {/* Machine Health Passport */}
            <Card className="border-2 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <History className="w-5 h-5" />
                  Health History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">Healthy</p>
                      <p className="text-xs text-slate-500">3 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">Lubrication Alert</p>
                      <p className="text-xs text-slate-500">1 week ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">Maintenance Done</p>
                      <p className="text-xs text-slate-500">2 weeks ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
