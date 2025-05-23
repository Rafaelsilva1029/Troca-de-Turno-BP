"use client"

import { useEffect, useState, useRef } from "react"
import {
  Activity,
  AlertCircle,
  Bell,
  Hexagon,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sun,
  Wifi,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { SidebarProvider } from "@/components/ui/sidebar"
import MainSidebar from "@/components/main-sidebar"
import { MetricCard } from "@/components/metric-card"
import { ProcessRow } from "@/components/process-row"
import { StorageItem } from "@/components/storage-item"
import { AlertItem } from "@/components/alert-item"
import { ActionButton } from "@/components/action-button"
import { useDashboardSettings } from "@/hooks/use-dashboard-settings"

export default function Dashboard() {
  const { settings, updateSettings } = useDashboardSettings()
  const [systemStatus, setSystemStatus] = useState(85)
  const [cpuUsage, setCpuUsage] = useState(42)
  const [memoryUsage, setMemoryUsage] = useState(68)
  const [networkStatus, setNetworkStatus] = useState(92)
  const [securityLevel, setSecurityLevel] = useState(75)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Simulate changing data
  useEffect(() => {
    const interval = setInterval(() => {
      if (settings.animations) {
        setCpuUsage(Math.floor(Math.random() * 30) + 30)
        setMemoryUsage(Math.floor(Math.random() * 20) + 60)
        setNetworkStatus(Math.floor(Math.random() * 15) + 80)
        setSystemStatus(Math.floor(Math.random() * 10) + 80)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [settings.animations])

  // Particle effect
  useEffect(() => {
    if (!settings.animations) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles: Particle[] = []
    const particleCount = 100

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 3 + 1
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.color = `rgba(${Math.floor(Math.random() * 100) + 100}, ${Math.floor(Math.random() * 100) + 150}, ${Math.floor(Math.random() * 55) + 200}, ${Math.random() * 0.5 + 0.2})`
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        particle.update()
        particle.draw()
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [settings.animations])

  // Toggle theme
  const toggleTheme = () => {
    updateSettings({
      theme: settings.theme === "dark" ? "light" : "dark",
    })
  }

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <SidebarProvider defaultOpen={settings.sidebarOpen} onOpenChange={(open) => updateSettings({ sidebarOpen: open })}>
      <div
        className={`${settings.theme} min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 relative overflow-hidden`}
      >
        {/* Background particle effect */}
        {settings.animations && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />}

        {/* Offline indicator */}
        {!isOnline && (
          <div className="fixed top-4 right-4 bg-red-900/80 text-white px-4 py-2 rounded-md z-50 flex items-center">
            <Wifi className="h-4 w-4 mr-2 stroke-white" />
            Offline Mode - Some features may be limited
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
                <div className="absolute inset-2 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-4 border-r-purple-500 border-t-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow"></div>
                <div className="absolute inset-6 border-4 border-b-blue-500 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-slower"></div>
                <div className="absolute inset-8 border-4 border-l-green-500 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
              </div>
              <div className="mt-4 text-cyan-500 font-mono text-sm tracking-wider">SYSTEM INITIALIZING</div>
            </div>
          </div>
        )}

        <div className="flex h-screen">
          {/* Sidebar */}
          <MainSidebar />

          {/* Main content */}
          <div className="flex-1 overflow-auto">
            {/* Header */}
            <header className="flex items-center justify-between py-4 px-6 border-b border-slate-700/50 sticky top-0 z-10 backdrop-blur-sm bg-slate-900/70">
              <div className="flex items-center space-x-2">
                <Hexagon className="h-8 w-8 text-cyan-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  NEXUS OS
                </span>
              </div>

              <div className="flex items-center space-x-6">
                <div className="hidden md:flex items-center space-x-1 bg-slate-800/50 rounded-full px-3 py-1.5 border border-slate-700/50 backdrop-blur-sm">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search systems..."
                    className="bg-transparent border-none focus:outline-none text-sm w-40 placeholder:text-slate-500"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-100">
                          <Bell className="h-5 w-5" />
                          {settings.notifications && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 bg-cyan-500 rounded-full animate-pulse"></span>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notifications</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleTheme}
                          className="text-slate-400 hover:text-slate-100"
                        >
                          {settings.theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Toggle theme</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Avatar>
                    <AvatarImage src="/abstract-geometric-shapes.png" alt="User" />
                    <AvatarFallback className="bg-slate-700 text-cyan-500">CM</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </header>

            {/* Main content */}
            <main className="p-6 space-y-6">
              {/* System overview */}
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-100 flex items-center">
                      <Activity className="mr-2 h-5 w-5 text-cyan-500" />
                      System Overview
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-slate-800/50 text-cyan-400 border-cyan-500/50 text-xs">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 mr-1 animate-pulse"></div>
                        LIVE
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                      title="CPU Usage"
                      value={cpuUsage}
                      icon="Cpu"
                      trend="up"
                      color="cyan"
                      detail="3.8 GHz | 12 Cores"
                    />
                    <MetricCard
                      title="Memory"
                      value={memoryUsage}
                      icon="HardDrive"
                      trend="stable"
                      color="purple"
                      detail="16.4 GB / 24 GB"
                    />
                    <MetricCard
                      title="Network"
                      value={networkStatus}
                      icon="Wifi"
                      trend="down"
                      color="blue"
                      detail="1.2 GB/s | 42ms"
                    />
                  </div>

                  <div className="mt-8">
                    <Tabs defaultValue="performance" className="w-full">
                      <div className="flex items-center justify-between mb-4">
                        <TabsList className="bg-slate-800/50 p-1">
                          <TabsTrigger
                            value="performance"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                          >
                            Performance
                          </TabsTrigger>
                          <TabsTrigger
                            value="processes"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                          >
                            Processes
                          </TabsTrigger>
                          <TabsTrigger
                            value="storage"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                          >
                            Storage
                          </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-cyan-500 mr-1"></div>
                            CPU
                          </div>
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-purple-500 mr-1"></div>
                            Memory
                          </div>
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                            Network
                          </div>
                        </div>
                      </div>

                      <TabsContent value="performance" className="mt-0">
                        <div className="h-64 w-full relative bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                          <PerformanceChart />
                          <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-md px-3 py-2 border border-slate-700/50">
                            <div className="text-xs text-slate-400">System Load</div>
                            <div className="text-lg font-mono text-cyan-400">{cpuUsage}%</div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="processes" className="mt-0">
                        <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                          <div className="grid grid-cols-12 text-xs text-slate-400 p-3 border-b border-slate-700/50 bg-slate-800/50">
                            <div className="col-span-1">PID</div>
                            <div className="col-span-4">Process</div>
                            <div className="col-span-2">User</div>
                            <div className="col-span-2">CPU</div>
                            <div className="col-span-2">Memory</div>
                            <div className="col-span-1">Status</div>
                          </div>

                          <div className="divide-y divide-slate-700/30">
                            <ProcessRow
                              pid="1024"
                              name="system_core.exe"
                              user="SYSTEM"
                              cpu={12.4}
                              memory={345}
                              status="running"
                            />
                            <ProcessRow
                              pid="1842"
                              name="nexus_service.exe"
                              user="SYSTEM"
                              cpu={8.7}
                              memory={128}
                              status="running"
                            />
                            <ProcessRow
                              pid="2156"
                              name="security_monitor.exe"
                              user="ADMIN"
                              cpu={5.2}
                              memory={96}
                              status="running"
                            />
                            <ProcessRow
                              pid="3012"
                              name="network_manager.exe"
                              user="SYSTEM"
                              cpu={3.8}
                              memory={84}
                              status="running"
                            />
                            <ProcessRow
                              pid="4268"
                              name="user_interface.exe"
                              user="USER"
                              cpu={15.3}
                              memory={256}
                              status="running"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="storage" className="mt-0">
                        <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StorageItem name="System Drive (C:)" total={512} used={324} type="SSD" />
                            <StorageItem name="Data Drive (D:)" total={2048} used={1285} type="HDD" />
                            <StorageItem name="Backup Drive (E:)" total={4096} used={1865} type="HDD" />
                            <StorageItem name="External Drive (F:)" total={1024} used={210} type="SSD" />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>

              {/* Alert and communication widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Security Status */}
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 flex items-center text-base">
                      <Shield className="mr-2 h-5 w-5 text-green-500" />
                      Security Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">Firewall</div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">Intrusion Detection</div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">Encryption</div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">Threat Database</div>
                        <div className="text-sm text-cyan-400">
                          Updated <span className="text-slate-500">12 min ago</span>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">Security Level</div>
                          <div className="text-sm text-cyan-400">{securityLevel}%</div>
                        </div>
                        <Progress value={securityLevel} className="h-2 bg-slate-700">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full"
                            style={{ width: `${securityLevel}%` }}
                          />
                        </Progress>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Alerts */}
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 flex items-center text-base">
                      <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
                      System Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <AlertItem
                        title="Security Scan Complete"
                        time="14:32:12"
                        description="No threats detected in system scan"
                        type="info"
                      />
                      <AlertItem
                        title="Bandwidth Spike Detected"
                        time="13:45:06"
                        description="Unusual network activity on port 443"
                        type="warning"
                      />
                      <AlertItem
                        title="System Update Available"
                        time="09:12:45"
                        description="Version 12.4.5 ready to install"
                        type="update"
                      />
                      <AlertItem
                        title="Backup Completed"
                        time="04:30:00"
                        description="Incremental backup to drive E: successful"
                        type="success"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Settings Card */}
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 flex items-center text-base">
                    <Settings className="mr-2 h-5 w-5 text-cyan-500" />
                    Dashboard Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Zap className="text-cyan-500 mr-2 h-4 w-4" />
                          <Label className="text-sm text-slate-400">Enable Animations</Label>
                        </div>
                        <Switch
                          checked={settings.animations}
                          onCheckedChange={(checked) => updateSettings({ animations: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Bell className="text-cyan-500 mr-2 h-4 w-4" />
                          <Label className="text-sm text-slate-400">Show Notifications</Label>
                        </div>
                        <Switch
                          checked={settings.notifications}
                          onCheckedChange={(checked) => updateSettings({ notifications: checked })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="layout" className="text-sm text-slate-400 mb-2 block">
                          Layout Density
                        </Label>
                        <select
                          id="layout"
                          className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm"
                          value={settings.layout}
                          onChange={(e) => updateSettings({ layout: e.target.value as any })}
                        >
                          <option value="compact">Compact</option>
                          <option value="default">Default</option>
                          <option value="expanded">Expanded</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="theme" className="text-sm text-slate-400 mb-2 block">
                          Color Theme
                        </Label>
                        <select
                          id="theme"
                          className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm"
                          value={settings.theme}
                          onChange={(e) => updateSettings({ theme: e.target.value as any })}
                        >
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                          <option value="system">System</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ActionButton icon="Shield" label="Security Scan" />
                <ActionButton icon="RefreshCw" label="Sync Data" />
                <ActionButton icon="Download" label="Backup" />
                <ActionButton icon="Terminal" label="Console" />
              </div>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}

// Performance chart component
function PerformanceChart() {
  return (
    <div className="h-full w-full flex items-end justify-between px-4 pt-4 pb-8 relative">
      {/* Y-axis labels */}
      <div className="absolute left-2 top-0 h-full flex flex-col justify-between py-4">
        <div className="text-xs text-slate-500">100%</div>
        <div className="text-xs text-slate-500">75%</div>
        <div className="text-xs text-slate-500">50%</div>
        <div className="text-xs text-slate-500">25%</div>
        <div className="text-xs text-slate-500">0%</div>
      </div>

      {/* X-axis grid lines */}
      <div className="absolute left-0 right-0 top-0 h-full flex flex-col justify-between py-4 px-10">
        <div className="border-b border-slate-700/30 w-full"></div>
        <div className="border-b border-slate-700/30 w-full"></div>
        <div className="border-b border-slate-700/30 w-full"></div>
        <div className="border-b border-slate-700/30 w-full"></div>
        <div className="border-b border-slate-700/30 w-full"></div>
      </div>

      {/* Chart bars */}
      <div className="flex-1 h-full flex items-end justify-between px-2 z-10">
        {Array.from({ length: 24 }).map((_, i) => {
          const cpuHeight = Math.floor(Math.random() * 60) + 20
          const memHeight = Math.floor(Math.random() * 40) + 40
          const netHeight = Math.floor(Math.random() * 30) + 30

          return (
            <div key={i} className="flex space-x-0.5">
              <div
                className="w-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-sm"
                style={{ height: `${cpuHeight}%` }}
              ></div>
              <div
                className="w-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-sm"
                style={{ height: `${memHeight}%` }}
              ></div>
              <div
                className="w-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm"
                style={{ height: `${netHeight}%` }}
              ></div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-10">
        <div className="text-xs text-slate-500">00:00</div>
        <div className="text-xs text-slate-500">06:00</div>
        <div className="text-xs text-slate-500">12:00</div>
        <div className="text-xs text-slate-500">18:00</div>
        <div className="text-xs text-slate-500">24:00</div>
      </div>
    </div>
  )
}
