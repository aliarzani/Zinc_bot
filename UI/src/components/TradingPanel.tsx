// UI/src/components/TradingPanel.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Calendar,
  Settings,
  Play,
  Square,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Brain,
  Bitcoin,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface TradingPanelProps {
  hasApiKeys: boolean;
}

interface BacktestResult {
  initialBalance: number;
  finalBalance: number;
  netProfit: number;
  winRate: number;
  maxDrawdown: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  isRunning: boolean;
  progress: number;
  signals?: Array<{
    timestamp: string;
    signal: 'BUY' | 'SELL' | 'HOLD' | 'EXIT';
    price: number;
  }>;
}

interface LiveBotStatus {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  logs: Array<{
    timestamp: string;
    message: string;
    type: 'info' | 'error' | 'warning';
  }>;
  startTime: string;
  endTime?: string;
  settings: {
    balance: number;
    leverage: number;
    maxRisk: number;
  };
  currentPrice?: number;
  prediction?: number;
  lastSignal?: 'BUY' | 'SELL' | 'HOLD';
  profit?: number;
}

export function TradingPanel({ hasApiKeys }: TradingPanelProps) {
  const [backtestSettings, setBacktestSettings] = useState({
    balance: '10000',
    leverage: '1',
    period: '7',
    timeframe: '1m'
  });

  const [liveSettings, setLiveSettings] = useState({
    balance: '1000',
    leverage: '1',
    maxRisk: '2'
  });

  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [liveBotStatus, setLiveBotStatus] = useState<LiveBotStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  const API_BASE_URL = '/api/v1';

  useEffect(() => {
    loadSavedSettings();
    
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, []);

  // Add this function to load saved settings
  const loadSavedSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/live/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update live settings with saved values
          setLiveSettings({
            balance: data.settings.balance.toString(),
            leverage: data.settings.leverage.toString(),
            maxRisk: data.settings.maxRisk.toString()
          });

          // If bot is running, load its status
          if (data.settings.isLiveTrading) {
            loadRunningBotStatus();
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved settings:', error);
    }
  };

  // Add this function to load running bot status
  const loadRunningBotStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/live/bots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.bots.length > 0) {
          const runningBot = data.bots.find((bot: any) => bot.status === 'running');
          if (runningBot) {
            // Set initial status
            setLiveBotStatus({
              id: runningBot.id,
              status: 'running',
              logs: [],
              startTime: runningBot.startTime,
              settings: runningBot.settings
            });
            
            // Monitor the running bot
            monitorBotStatus(runningBot.id, 'live');
          }
        }
      }
    } catch (error) {
      console.error('Error loading running bot status:', error);
    }
  };

  // Add this helper function
  const calculateProgress = (logs: any[]) => {
    if (!logs || logs.length === 0) return 0;
    
    const totalLogs = 100; // Assuming 100 logs for completion
    return Math.min((logs.length / totalLogs) * 100, 100);
  };

  const handleBacktest = async () => {
    if (!hasApiKeys) {
      toast.error('ابتدا کلیدهای API خود را تنظیم کنید');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/backtest/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          balance: parseFloat(backtestSettings.balance),
          leverage: parseInt(backtestSettings.leverage),
          period: backtestSettings.period,
          timeframe: backtestSettings.timeframe
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('بک‌تست شروع شد');
        monitorBotStatus(data.botId, 'backtest');
      } else {
        toast.error(data.message || 'خطا در شروع بک‌تست');
      }
    } catch (error) {
      console.error('Backtest error:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLiveTrading = async () => {
    if (!hasApiKeys) {
      toast.error('ابتدا کلیدهای API خود را تنظیم کنید');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/live/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          balance: parseFloat(liveSettings.balance),
          leverage: parseInt(liveSettings.leverage),
          maxRisk: parseFloat(liveSettings.maxRisk)
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('معاملات زنده شروع شد');
        setLiveBotStatus({
          id: data.botId,
          status: 'running',
          logs: [],
          startTime: new Date().toISOString(),
          settings: {
            balance: parseFloat(liveSettings.balance),
            leverage: parseInt(liveSettings.leverage),
            maxRisk: parseFloat(liveSettings.maxRisk)
          }
        });
        monitorBotStatus(data.botId, 'live');
      } else {
        toast.error(data.message || 'خطا در شروع معاملات زنده');
      }
    } catch (error) {
      console.error('Live trading error:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopLiveTrading = async () => {
    if (!liveBotStatus) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/live/stop/${liveBotStatus.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.info('معاملات زنده متوقف شد');
        if (monitoringInterval) {
          clearInterval(monitoringInterval);
        }
        setLiveBotStatus(prev => prev ? { ...prev, status: 'stopped' } : null);
      }
    } catch (error) {
      console.error('Stop live trading error:', error);
      toast.error('خطا در توقف معاملات زنده');
    }
  };

const monitorBotStatus = (botId: string, type: 'backtest' | 'live') => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }

  const interval = setInterval(async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'backtest' ? 'backtest' : 'live';
      const response = await fetch(`${API_BASE_URL}/${endpoint}/status/${botId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (type === 'backtest') {
          setBacktestResult(prev => ({
            ...prev,
            ...data.result,
            isRunning: data.bot.status === 'running',
            progress: calculateProgress(data.bot.logs)
          }));
        } else {
          setLiveBotStatus(prev => ({
            ...prev,
            ...data.bot,
            settings: data.bot.settings || prev?.settings
          }));
        }

        if (data.bot.status !== 'running') {
          clearInterval(interval);
          if (data.bot.status === 'completed') {
            toast.success(type === 'backtest' ? 'Backtest completed!' : 'Live trading completed!');
          }
        }
      }
    } catch (error) {
      console.error('Monitoring error:', error);
    }
  }, 3000);

  setMonitoringInterval(interval);
};

  const getPredictionColor = (prediction: number) => {
    if (prediction > 0.7) return 'text-green-600';
    if (prediction < 0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getPredictionIcon = (prediction: number) => {
    if (prediction > 0.7) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (prediction < 0.3) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Brain className="w-4 h-4 text-yellow-600" />;
  };

  const getSignalBadge = (signal?: string) => {
    switch (signal) {
      case 'BUY':
        return <Badge className="bg-green-500 persian-text">خرید</Badge>;
      case 'SELL':
        return <Badge className="bg-red-500 persian-text">فروش</Badge>;
      case 'HOLD':
        return <Badge className="bg-blue-500 persian-text">نگهداری</Badge>;
      default:
        return <Badge className="bg-gray-500 persian-text">نامشخص</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500 persian-text">در حال اجرا</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 persian-text">تکمیل شده</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 persian-text">خطا</Badge>;
      case 'stopped':
        return <Badge className="bg-yellow-500 persian-text">متوقف شده</Badge>;
      default:
        return <Badge className="bg-gray-500 persian-text">نامشخص</Badge>;
    }
  };

  if (!hasApiKeys) {
    return (
      <Card className="border-yellow-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
            <h3 className="text-lg persian-text">نیاز به تنظیم کلیدهای API</h3>
            <p className="text-muted-foreground persian-text">
              برای استفاده از ربات معاملاتی، ابتدا کلیدهای API خود را در بخش تنظیمات وارد کنید
            </p>
            <Button variant="outline" className="persian-text">
              <Settings className="w-4 h-4 ml-2" />
              رفتن به تنظیمات
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="backtest" className="w-full">
        <TabsList className="grid grid-cols-2 max-w-sm mx-auto">
          <TabsTrigger value="backtest" className="persian-text">
            <BarChart3 className="w-4 h-4 ml-2" />
            بک‌تست
          </TabsTrigger>
          <TabsTrigger value="live" className="persian-text">
            <Activity className="w-4 h-4 ml-2" />
            معاملات زنده
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backtest" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="persian-text">تنظیمات بک‌تست</CardTitle>
              <CardDescription className="persian-text">
                عملکرد استراتژی را در بازه زمانی مشخص بررسی کنید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="persian-text">موجودی اولیه (USDT)</Label>
                  <Input
                    value={backtestSettings.balance}
                    onChange={(e) => setBacktestSettings({...backtestSettings, balance: e.target.value})}
                    placeholder="10000"
                    className="english-text"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="persian-text">اهرم (Leverage)</Label>
                  <Select 
                    value={backtestSettings.leverage}
                    onValueChange={(value) => setBacktestSettings({...backtestSettings, leverage: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                      <SelectItem value="3">3x</SelectItem>
                      <SelectItem value="5">5x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleBacktest} 
                className="w-full persian-text"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    در حال انجام...
                  </>
                ) : (
                  'شروع بک‌تست'
                )}
              </Button>
            </CardContent>
          </Card>

          {backtestResult && (
            <Card>
              <CardHeader>
                <CardTitle className="persian-text">نتایج بک‌تست</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="persian-text">موجودی اولیه</Label>
                    <p className="text-lg font-semibold">${backtestResult.initialBalance}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="persian-text">موجودی نهایی</Label>
                    <p className="text-lg font-semibold">${backtestResult.finalBalance}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="persian-text">سود خالص</Label>
                    <p className={`text-lg font-semibold ${backtestResult.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${backtestResult.netProfit}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="persian-text">نرخ برد</Label>
                    <p className="text-lg font-semibold">{backtestResult.winRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="live" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="persian-text">تنظیمات معاملات زنده</CardTitle>
              <CardDescription className="persian-text">
                ربات را با سرمایه واقعی راه‌اندازی کنید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 persian-text">
                  <strong>هشدار:</strong> معاملات زنده با ریسک واقعی همراه است. فقط با سرمایه‌ای معامله کنید که از دست دادن آن را تحمل می‌کنید.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="persian-text">موجودی معاملاتی (USDT)</Label>
                  <Input
                    value={liveSettings.balance}
                    onChange={(e) => setLiveSettings({...liveSettings, balance: e.target.value})}
                    placeholder="1000"
                    className="english-text"
                    disabled={liveBotStatus?.status === 'running'}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="persian-text">اهرم (Leverage)</Label>
                  <Select 
                    value={liveSettings.leverage}
                    onValueChange={(value) => setLiveSettings({...liveSettings, leverage: value})}
                    disabled={liveBotStatus?.status === 'running'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                      <SelectItem value="3">3x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="persian-text">حداکثر ریسک در هر معامله (%)</Label>
                <Input
                  value={liveSettings.maxRisk}
                  onChange={(e) => setLiveSettings({...liveSettings, maxRisk: e.target.value})}
                  placeholder="2"
                  className="english-text"
                  disabled={liveBotStatus?.status === 'running'}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-1">
                  <p className="persian-text">وضعیت ربات:</p>
                  {liveBotStatus ? (
                    getStatusBadge(liveBotStatus.status)
                  ) : (
                    <Badge variant="secondary" className="persian-text">غیرفعال</Badge>
                  )}
                </div>
                {liveBotStatus?.status === 'running' ? (
                  <Button 
                    onClick={handleStopLiveTrading}
                    variant="destructive"
                    className="persian-text"
                    disabled={isLoading}
                  >
                    <Square className="w-4 h-4 ml-2" />
                    توقف ربات
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStartLiveTrading}
                    className="persian-text"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                        در حال شروع...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 ml-2" />
                        شروع معاملات
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {liveBotStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="persian-text">وضعیت معاملات زنده</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Real-time Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Label className="persian-text">قیمت فعلی BTC</Label>
                      <div className="flex items-center justify-center mt-2">
                        <Bitcoin className="w-5 h-5 text-orange-500 mr-2" />
                        <p className="text-xl font-bold">
                          ${liveBotStatus.currentPrice ? liveBotStatus.currentPrice.toLocaleString() : '--'}
                        </p>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Label className="persian-text">پیش‌بینی AI</Label>
                      <div className="flex items-center justify-center mt-2">
                        {liveBotStatus.prediction && getPredictionIcon(liveBotStatus.prediction)}
                        <p className={`text-xl font-bold ml-2 ${getPredictionColor(liveBotStatus.prediction || 0.5)}`}>
                          {liveBotStatus.prediction ? (liveBotStatus.prediction * 100).toFixed(1) + '%' : '--'}
                        </p>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Label className="persian-text">سیگنال فعلی</Label>
                      <div className="mt-2">
                        {getSignalBadge(liveBotStatus.lastSignal)}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Label className="persian-text">سود/زیان</Label>
                      <p className={`text-xl font-bold mt-2 ${(liveBotStatus.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${liveBotStatus.profit ? liveBotStatus.profit.toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Settings Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="persian-text">موجودی</Label>
                      <p className="text-lg font-semibold">${liveBotStatus.settings.balance}</p>
                    </div>
                    <div>
                      <Label className="persian-text">اهرم</Label>
                      <p className="text-lg font-semibold">{liveBotStatus.settings.leverage}x</p>
                    </div>
                    <div>
                      <Label className="persian-text">حداکثر ریسک</Label>
                      <p className="text-lg font-semibold">{liveBotStatus.settings.maxRisk}%</p>
                    </div>
                  </div>

                  {/* Logs */}
                  {liveBotStatus.logs.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <Label className="persian-text">آخرین لاگ‌ها</Label>
                        <div className="max-h-48 overflow-y-auto mt-2 space-y-2">
                          {liveBotStatus.logs.slice(-10).map((log, index) => (
                            <div
                              key={index}
                              className={`text-sm font-mono p-2 rounded ${
                                log.type === 'error' ? 'bg-red-50 text-red-700' :
                                log.type === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleTimeString('fa-IR')}
                              </span>
                              {' - '}
                              {log.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}