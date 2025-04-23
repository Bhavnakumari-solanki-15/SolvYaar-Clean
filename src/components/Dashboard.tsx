import React, { useEffect, useState, useMemo, useCallback } from "react";
import { PieChart, Pie, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useTheme } from "./theme-provider";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface QueryEvent {
  id: string;
  userId: string;
  topic: string;
  latex: string;
  formulaType: string;
  timestamp: number;
}

interface MathQuery {
  id: string;
  topic: string;
  latex: string;
  timestamp: number;
}

interface WebSocketMessage {
  type: 'connection' | 'active_users' | 'query_event' | 'initial_events' | 'query';
  id?: string;
  userId?: string;
  topic?: string;
  latex?: string;
  formulaType?: string;
  data?: any;
}

interface DashboardStats {
  activeUsers: number;
  totalQueries: number;
  uniqueFormulas: Set<string>;
  topics: Set<string>;
}

// Fallback chart components for when Recharts fails to load
const SimplePieChart = ({ data, colorMap }: { data: Array<{name: string, value: number}>, colorMap: Record<string, string> }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="flex flex-col h-full justify-center">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden border border-border" style={{ background: "conic-gradient(from 0deg, " + 
          data.map((item, i) => {
            const startPercent = data.slice(0, i).reduce((sum, d) => sum + d.value, 0) / total * 100;
            return `${colorMap[item.name] || `hsl(${i * 50}, 70%, 65%)`} ${startPercent}% ${startPercent + (item.value / total * 100)}%`;
          }).join(', ') + ")"
        }}>
          <div className="absolute inset-[25%] rounded-full bg-background"></div>
        </div>
        <div className="flex flex-col gap-2 mt-4 sm:mt-0 max-w-full overflow-hidden">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: colorMap[item.name] || `hsl(${i * 50}, 70%, 65%)` }}
              ></div>
              <span className="text-sm truncate">{item.name}: {item.value} ({Math.round(item.value / total * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SimpleBarChart = ({ data, colorMap }: { data: Array<{name: string, value: number}>, colorMap: Record<string, string> }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="flex flex-col h-full justify-center">
      <div className="flex flex-col gap-3 px-2">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm truncate max-w-[70%]">{item.name}</span>
              <span className="text-sm">{item.value}</span>
            </div>
            <div className="h-6 w-full bg-muted rounded overflow-hidden">
              <div 
                className="h-full rounded" 
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: colorMap[item.name] || `hsl(${i * 50}, 70%, 65%)`
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SimpleLineChart = ({ data, keyNames, isMobile }: { 
  data: Array<Record<string, any>>, 
  keyNames: Array<{key: string, color: string, label: string}>,
  isMobile: boolean
}) => {
  const maxValue = Math.max(...data.flatMap(item => 
    keyNames.map(k => typeof item[k.key] === 'number' ? item[k.key] : 0)
  ));
  
  return (
    <div className="flex flex-col h-full justify-center">
      <div className="relative h-60 w-full border-l border-b border-border p-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between pr-2 -translate-y-2">
          <span className="text-xs">{maxValue}</span>
          <span className="text-xs">{Math.round(maxValue / 2)}</span>
          <span className="text-xs">0</span>
        </div>
        
        {/* Grid lines */}
        <div className="ml-6 h-full flex flex-col justify-between">
          <div className="w-full border-t border-border/30"></div>
          <div className="w-full border-t border-border/30"></div>
          <div className="w-full border-t border-border/30"></div>
        </div>
        
        {/* Data points */}
        <div className="absolute inset-0 p-4 ml-6">
          {keyNames.map((keyInfo, keyIndex) => (
            <svg key={keyIndex} className="absolute inset-0 overflow-visible" preserveAspectRatio="none">
              <polyline
                points={data.map((item, i) => 
                  `${(i / (data.length - 1)) * 100}%,${100 - ((item[keyInfo.key] || 0) / maxValue) * 100}%`
                ).join(' ')}
                fill="none"
                strokeWidth="2"
                stroke={keyInfo.color}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          ))}
        </div>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between ml-6 translate-y-4">
          {data.map((item, i) => isMobile ? 
            // Show fewer labels on mobile
            (i % 3 === 0 || i === data.length - 1) && (
              <span key={i} className="text-xs transform -rotate-45 origin-top-left">
                {typeof item.hour === 'string' ? item.hour : ''}
              </span>
            ) : (
              <span key={i} className="text-xs transform -rotate-45 origin-top-left">
                {typeof item.hour === 'string' ? item.hour : ''}
              </span>
            )
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-6 flex-wrap">
        {keyNames.map((keyInfo, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: keyInfo.color }}></div>
            <span className="text-sm">{keyInfo.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Modern color palette with better contrast and theme support
const CHART_COLORS = {
  primary: {
    light: [
      'hsl(252, 87%, 53%)',
      'hsl(252, 87%, 63%)',
      'hsl(252, 87%, 73%)',
    ],
    dark: [
      'hsl(252, 87%, 73%)',
      'hsl(252, 87%, 83%)',
      'hsl(252, 87%, 93%)',
    ]
  },
  accent: {
    light: [
      'hsl(262, 83%, 58%)',
      'hsl(262, 83%, 68%)',
      'hsl(262, 83%, 78%)',
    ],
    dark: [
      'hsl(262, 83%, 78%)',
      'hsl(262, 83%, 88%)',
      'hsl(262, 83%, 98%)',
    ]
  },
  muted: {
    light: [
      'hsl(215, 16%, 47%)',
      'hsl(215, 16%, 57%)',
      'hsl(215, 16%, 67%)',
    ],
    dark: [
      'hsl(215, 16%, 67%)',
      'hsl(215, 16%, 77%)',
      'hsl(215, 16%, 87%)',
    ]
  }
};

export const Dashboard = () => {
  const { activeUsers, connectionStatus, sendMessage, isConnected } = useWebSocket();
  const [data, setData] = useState<QueryEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recentQueries, setRecentQueries] = useState<MathQuery[]>([]);
  const { theme, systemTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // State for checking if Recharts is loaded properly
  const [rechartsLoaded, setRechartsLoaded] = useState<boolean>(true);
  
  // State for collaborative room
  const [userName, setUserName] = useState<string>(() => localStorage.getItem("userName") || "");
  const [roomCode, setRoomCode] = useState<string>("");
  
  // Get current theme colors
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const colors = useMemo(() => ({
    primary: CHART_COLORS.primary[currentTheme as 'light' | 'dark'],
    accent: CHART_COLORS.accent[currentTheme as 'light' | 'dark'],
    muted: CHART_COLORS.muted[currentTheme as 'light' | 'dark']
  }), [currentTheme]);

  // Track the last processed event at component level
  const lastEventRef = React.useRef<QueryEvent | null>(null);

  // Check if Recharts is available
  useEffect(() => {
    try {
      // Test if Recharts components are accessible
      const testComponent = <PieChart width={100} height={100}><Pie data={[]} dataKey="value" /></PieChart>;
      setRechartsLoaded(true);
    } catch (err) {
      console.error("Recharts failed to load:", err);
      setRechartsLoaded(false);
    }
  }, []);

  const processEvent = useCallback((event: QueryEvent) => {
    setData(prevEvents => {
      // Check if we've already processed this event
      if (event.id === lastEventRef.current?.id) {
        return prevEvents;
      }

      // Update last event reference
      lastEventRef.current = event;
      
      // Add new event to the beginning of the array
      const newEvents = [event, ...prevEvents];
      
      // Keep only the last 100 events to prevent memory issues
      return newEvents.slice(0, 100);
    });
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    console.log('Setting up WebSocket message handler, connected:', isConnected);
    
    const handleMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const message: WebSocketMessage = customEvent.detail;
      console.log('Received WebSocket message:', message);
      
      switch (message.type) {
        case 'initial_events':
          console.log('Received initial events:', message.data);
          if (Array.isArray(message.data)) {
            setData(message.data);
          }
          break;
          
        case 'query_event':
          console.log('Received query event:', message);
          if (message.data || (message.id && message.latex)) {
            const eventData = message.data || message;
            const newEvent: QueryEvent = {
              id: eventData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              userId: eventData.userId || 'anonymous',
              topic: eventData.topic || 'unknown',
              latex: eventData.latex || '',
              formulaType: eventData.formulaType || 'unknown',
              timestamp: eventData.timestamp || Date.now()
            };
            
            console.log('Processing new event:', newEvent);
            setData(prevEvents => {
              // Check if we've already processed this event
              if (prevEvents.some(e => e.id === newEvent.id)) {
                console.log('Duplicate event, skipping');
                return prevEvents;
              }
              
              // Add new event to the beginning and keep last 100
              const updatedEvents = [newEvent, ...prevEvents].slice(0, 100);
              console.log('Updated events count:', updatedEvents.length);
              return updatedEvents;
            });
            
            setRecentQueries(prev => {
              const newQuery: MathQuery = {
                id: newEvent.id,
                topic: newEvent.topic,
                latex: newEvent.latex,
                timestamp: newEvent.timestamp
              };
              
              if (prev.some(q => q.id === newQuery.id)) {
                return prev;
              }
              return [newQuery, ...prev].slice(0, 5);
            });
          }
          break;
      }
    };

    window.addEventListener('websocket-message', handleMessage);
    
    // Request initial data when component mounts
    if (isConnected) {
      console.log('Requesting initial events...');
      sendMessage({ type: 'get_initial_events' });
    }

    return () => {
      console.log('Cleaning up WebSocket message handler');
      window.removeEventListener('websocket-message', handleMessage);
    };
  }, [isConnected, sendMessage]);

  // Force re-render of charts when data changes
  const chartKey = useMemo(() => data?.length || 0, [data]);

  // Calculate statistics from data
  const { statistics, chartData } = useMemo(() => {
    console.log('Calculating statistics from data:', data?.length || 0, 'events');
    
    if (!data || data.length === 0) {
      return {
        statistics: {
          uniqueFormulas: 0,
          uniqueTopics: 0,
          uniqueFormulaTypes: 0
        },
        chartData: {
          formulaTypes: [],
          topics: [],
          complexity: []
        }
      };
    }
    
    const uniqueFormulas = new Set(data.map(event => event.latex));
    const uniqueTopics = new Set(data.map(event => event.topic));
    const uniqueFormulaTypes = new Set(data.map(event => event.formulaType));
    
    // Calculate complexity distribution
    const complexityGroups = data.reduce((acc, event) => {
      let complexity = 'Simple';
      const latex = event.latex;
      
      if (latex.includes('\\begin{') || latex.includes('\\end{') || 
          latex.includes('\\frac') || latex.includes('\\int')) {
        complexity = 'Complex';
      } else if (latex.includes('\\') || latex.length > 20) {
        complexity = 'Medium';
      }
      
      acc[complexity] = (acc[complexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const complexityData = Object.entries(complexityGroups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Sort formula types by frequency
    const formulaTypeData = Array.from(uniqueFormulaTypes)
      .map(type => ({
        name: type,
        value: data.filter(event => event.formulaType === type).length
      }))
      .sort((a, b) => b.value - a.value);

    // Sort topics by frequency
    const topicData = Array.from(uniqueTopics)
      .map(topic => ({
        name: topic,
        value: data.filter(event => event.topic === topic).length
      }))
      .sort((a, b) => b.value - a.value);
    
    return {
      statistics: {
        uniqueFormulas: uniqueFormulas.size,
        uniqueTopics: uniqueTopics.size,
        uniqueFormulaTypes: uniqueFormulaTypes.size
      },
      chartData: {
        formulaTypes: formulaTypeData,
        topics: topicData,
        complexity: complexityData
      }
    };
  }, [data]);

  // Calculate time-based data
  const timeBasedData = useMemo(() => {
    const now = Date.now();
    const last24Hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now - (23 - i) * 3600000);
      return {
        hour: hour.getHours(),
        queries: 0,
        users: new Set<string>()
      };
    });

    if (!data || data.length === 0) {
      return last24Hours.map(hour => ({
        hour: hour.hour,
        queries: 0,
        users: 0
      }));
    }

    data.forEach(event => {
      const eventHour = new Date(event.timestamp).getHours();
      const hourData = last24Hours.find(h => h.hour === eventHour);
      if (hourData) {
        hourData.queries++;
        hourData.users.add(event.userId);
      }
    });

    return last24Hours.map(hour => ({
      hour: `${hour.hour}:00`,
      queries: hour.queries,
      users: hour.users.size
    }));
  }, [data]);

  // Calculate trending topics
  const trendingTopics = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    
    const topicCounts = data.reduce((acc, cur) => {
      acc[cur.topic] = (acc[cur.topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
  }, [data]);

  const [tab, setTab] = useState('analytics');
  
  // Add a simple navigation function using React Router
  const navigateToRoom = (roomCode: string, isNew: boolean, name: string) => {
    // Store userName
    localStorage.setItem("userName", name);
    
    // Clear any previous room code
    localStorage.removeItem('collaboration_room_code');
    
    // Navigate to the room
    const url = `/collaboration/${roomCode}?isNew=${isNew}&name=${encodeURIComponent(name)}`;
    navigate(url);
  };

  const createRoom = () => {
    // Save user name
    if (!userName.trim()) {
      // Generate random name if empty
      const defaultName = `User_${Math.floor(Math.random() * 1000)}`;
      setUserName(defaultName);
      localStorage.setItem("userName", defaultName);
    } else {
      localStorage.setItem("userName", userName);
    }
    
    // Generate a random room code
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Navigate to the collaboration room
    navigateToRoom(newRoomCode, true, userName || `User_${Math.floor(Math.random() * 1000)}`);
  };
  
  const joinRoom = () => {
    if (!roomCode.trim()) {
      toast({
        title: "Room Code Required",
        description: "Please enter a room code to join a room.",
        variant: "destructive"
      });
      return;
    }
    
    // Save user name
    if (!userName.trim()) {
      // Generate random name if empty
      const defaultName = `User_${Math.floor(Math.random() * 1000)}`;
      setUserName(defaultName);
      localStorage.setItem("userName", defaultName);
    } else {
      localStorage.setItem("userName", userName);
    }
    
    // Navigate to the collaboration room
    navigateToRoom(roomCode, false, userName || `User_${Math.floor(Math.random() * 1000)}`);
  };

  // Create color maps for fallback charts
  const colorMaps = useMemo(() => {
    const formulaTypeColors: Record<string, string> = {};
    const topicColors: Record<string, string> = {};
    const complexityColors: Record<string, string> = {};
    
    chartData.formulaTypes.forEach((item, i) => {
      formulaTypeColors[item.name] = colors.primary[i % colors.primary.length];
    });
    
    chartData.topics.forEach((item, i) => {
      topicColors[item.name] = colors.accent[i % colors.accent.length];
    });
    
    chartData.complexity.forEach((item, i) => {
      complexityColors[item.name] = colors.muted[i % colors.muted.length];
    });
    
    return { formulaTypeColors, topicColors, complexityColors };
  }, [colors, chartData]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Connection Status */}
      <Alert variant={isConnected ? "default" : "destructive"} className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Connection Status</AlertTitle>
        <AlertDescription>
          {isConnected ? (
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span>Connected to server</span>
              <span className="text-muted-foreground">
                ({activeUsers} active users)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              <span>Disconnected from server</span>
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Formulas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.uniqueFormulas}</div>
              <p className="text-xs text-muted-foreground">
                Total unique mathematical expressions
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.uniqueTopics}</div>
              <p className="text-xs text-muted-foreground">
                Different mathematical topics
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-muted/5 to-muted/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formula Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.uniqueFormulaTypes}</div>
              <p className="text-xs text-muted-foreground">
                Different types of formulas
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full"
        >
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 h-full">
            <CardHeader className="pb-2 md:pb-6">
              <CardTitle className="text-base md:text-lg">Formula Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px] w-full">
                {chartData.formulaTypes && chartData.formulaTypes.length > 0 ? (
                  rechartsLoaded ? (
                    <ResponsiveContainer width="100%" height="100%" key={`formula-types-${chartKey}`}>
                      <PieChart>
                        <Pie
                          data={chartData.formulaTypes || []}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? "80%" : "90%"}
                          innerRadius={isMobile ? "35%" : "40%"}
                          label={isMobile ? undefined : ({ name, percent }) => 
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                          labelLine={!isMobile}
                          animationBegin={0}
                          animationDuration={750}
                          animationEasing="ease-out"
                        >
                          {chartData.formulaTypes && chartData.formulaTypes.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={colors.primary && colors.primary.length > 0 ? colors.primary[index % colors.primary.length] : '#888888'}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length && payload[0] && payload[0].payload) {
                              return (
                                <div className="rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur-sm">
                                  <div className="grid gap-2">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="h-2 w-2 rounded-full" 
                                        style={{ backgroundColor: payload[0].payload.fill }}
                                      />
                                      <span className="font-medium">
                                        {payload[0]?.name || 'Unknown'}
                                      </span>
                                    </div>
                                    <div className="text-right text-sm">
                                      {payload[0]?.value || 0} queries
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          content={({ payload }) => (
                            <div className="flex flex-wrap justify-center gap-3 pt-2">
                              {payload?.map((entry, index) => (
                                <div key={`legend-${index}`} className="flex items-center gap-2">
                                  <div 
                                    className="h-3 w-3 rounded-sm"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-xs sm:text-sm">{entry.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <SimplePieChart 
                      data={chartData.formulaTypes} 
                      colorMap={colorMaps.formulaTypeColors} 
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full"
        >
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 h-full">
            <CardHeader className="pb-2 md:pb-6">
              <CardTitle className="text-base md:text-lg">Topics Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px] w-full">
                {chartData.topics && chartData.topics.length > 0 ? (
                  rechartsLoaded ? (
                    <ResponsiveContainer width="100%" height="100%" key={`topics-${chartKey}`}>
                      <BarChart data={chartData.topics || []}>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="hsl(var(--border))" 
                          opacity={0.3}
                        />
                        <XAxis 
                          dataKey="name" 
                          stroke="hsl(var(--foreground))"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                          tickLine={{ stroke: 'hsl(var(--border))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                          interval={isMobile ? 1 : 0}
                        />
                        <YAxis 
                          stroke="hsl(var(--foreground))"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                          tickLine={{ stroke: 'hsl(var(--border))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip 
                          cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length && payload[0] && payload[0].payload) {
                              return (
                                <div className="rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur-sm">
                                  <div className="grid gap-2">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="h-2 w-2 rounded-full" 
                                        style={{ backgroundColor: payload[0].payload.fill }}
                                      />
                                      <span className="font-medium">
                                        {payload[0]?.name || 'Unknown'}
                                      </span>
                                    </div>
                                    <div className="text-right text-sm">
                                      {payload[0]?.value || 0} queries
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="value"
                          radius={[4, 4, 0, 0]}
                          animationBegin={0}
                          animationDuration={750}
                          animationEasing="ease-out"
                        >
                          {chartData.topics && chartData.topics.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={colors.accent && colors.accent.length > 0 ? colors.accent[index % colors.accent.length] : '#888888'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <SimpleBarChart 
                      data={chartData.topics} 
                      colorMap={colorMaps.topicColors} 
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Complexity Distribution */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full"
      >
        <Card className="bg-gradient-to-br from-muted/5 to-muted/10">
          <CardHeader className="pb-2 md:pb-6">
            <CardTitle className="text-base md:text-lg">Query Complexity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] sm:h-[300px] w-full">
              {chartData.complexity && chartData.complexity.length > 0 ? (
                rechartsLoaded ? (
                  <ResponsiveContainer width="100%" height="100%" key={`complexity-${chartKey}`}>
                    <PieChart>
                      <Pie
                        data={chartData.complexity || []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={isMobile ? "80%" : "90%"}
                        innerRadius={isMobile ? "35%" : "40%"}
                        label={isMobile ? undefined : ({ name, percent }) => 
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={!isMobile}
                        animationBegin={0}
                        animationDuration={750}
                        animationEasing="ease-out"
                      >
                        {chartData.complexity && chartData.complexity.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={colors.muted && colors.muted.length > 0 ? colors.muted[index % colors.muted.length] : '#888888'}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length && payload[0] && payload[0].payload) {
                            return (
                              <div className="rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur-sm">
                                <div className="grid gap-2">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="h-2 w-2 rounded-full" 
                                      style={{ backgroundColor: payload[0].payload.fill }}
                                    />
                                    <span className="font-medium">
                                      {payload[0]?.name || 'Unknown'}
                                    </span>
                                  </div>
                                  <div className="text-right text-sm">
                                    {payload[0]?.value || 0} queries
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        content={({ payload }) => (
                          <div className="flex flex-wrap justify-center gap-3 pt-2">
                            {payload?.map((entry, index) => (
                              <div key={`legend-${index}`} className="flex items-center gap-2">
                                <div 
                                  className="h-3 w-3 rounded-sm"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-xs sm:text-sm">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <SimplePieChart 
                    data={chartData.complexity} 
                    colorMap={colorMaps.complexityColors} 
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Over Time */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="w-full"
      >
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-2 md:pb-6">
            <CardTitle className="text-base md:text-lg">Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] sm:h-[300px] w-full">
              {timeBasedData && timeBasedData.length > 0 ? (
                rechartsLoaded ? (
                  <ResponsiveContainer width="100%" height="100%" key={`activity-${chartKey}`}>
                    <LineChart data={timeBasedData}>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="hsl(var(--border))" 
                        opacity={0.3}
                      />
                      <XAxis 
                        dataKey="hour" 
                        stroke="hsl(var(--foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        interval={isMobile ? 3 : 2}
                      />
                      <YAxis 
                        stroke="hsl(var(--foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur-sm">
                                <div className="font-medium mb-2">{label}</div>
                                {payload.map((entry, index) => (
                                  <div key={`tooltip-${index}`} className="flex items-center gap-2">
                                    <div 
                                      className="h-2 w-2 rounded-full" 
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-sm">
                                      {entry.name}: {entry.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="queries" 
                        stroke={colors.primary[0]} 
                        strokeWidth={2}
                        dot={!isMobile}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke={colors.accent[0]} 
                        strokeWidth={2}
                        dot={!isMobile}
                        activeDot={{ r: 6 }}
                      />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <SimpleLineChart 
                    data={timeBasedData} 
                    keyNames={[
                      { key: 'queries', color: colors.primary[0], label: 'Queries' },
                      { key: 'users', color: colors.accent[0], label: 'Users' }
                    ]} 
                    isMobile={isMobile}
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard; 