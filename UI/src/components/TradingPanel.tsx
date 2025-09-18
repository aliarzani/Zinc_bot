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
  ArrowDown,
  Eye
} from 'lucide-react';

interface TradingPanelProps {
  hasApiKeys: boolean;
}

interface BacktestResult {
  initialBalance: number | string;
  finalBalance: number | string;
  netProfit: number | string;
  winRate: number | string;
  maxDrawdown: number | string;
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
  const [showResults, setShowResults] = useState(false);

  const API_BASE_URL = '/api/v1';

  useEffect(() => {
    loadSavedSettings();
    
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, []);

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
          setLiveSettings({
            balance: data.settings.balance.toString(),
            leverage: data.settings.leverage.toString(),
            maxRisk: data.settings.maxRisk.toString()
          });

          if (data.settings.isLiveTrading) {
            loadRunningBotStatus();
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved settings:', error);
    }
  };

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
            setLiveBotStatus({
              id: runningBot.id,
              status: 'running',
              logs: [],
              startTime: runningBot.startTime,
              settings: runningBot.settings
            });
            
            monitorBotStatus(runningBot.id, 'live');
          }
        }
      }
    } catch (error) {
      console.error('Error loading running bot status:', error);
    }
  };

  const calculateProgress = (logs: any[]) => {
    if (!logs || logs.length === 0) return 0;
    
    const totalLogs = 100;
    return Math.min((logs.length / totalLogs) * 100, 100);
  };

  const handleBacktest = async () => {
    if (!hasApiKeys) {
      toast.error('ابتدا کلیدهای API خود را تنظیم کنید');
      return;
    }

    setIsLoading(true);
    setBacktestResult(null);
    setShowResults(false);
    
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
            if (data.bot.result) {
              setBacktestResult({
                initialBalance: data.bot.result.initialBalance,
                finalBalance: data.bot.result.finalBalance,
                netProfit: data.bot.result.netProfit,
                winRate: data.bot.result.winRate,
                maxDrawdown: data.bot.result.maxDrawdown,
                totalTrades: data.bot.result.totalTrades,
                winningTrades: data.bot.result.winningTrades,
                losingTrades: data.bot.result.losingTrades,
                isRunning: data.bot.status === 'running',
                progress: data.bot.status === 'running' ? 50 : 100
              });
              setShowResults(true);
            }
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
              toast.success(type === 'backtest' ? 'بک‌تست با موفقیت تکمیل شد!' : 'معاملات زنده تکمیل شد!');
            }
          }
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 3000);

    setMonitoringInterval(interval);
  };

  const loadBacktestHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/backtest/results`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results && data.results.length > 0) {
          const latestResult = data.results[0];
          setBacktestResult({
            initialBalance: latestResult.initialBalance,
            finalBalance: latestResult.finalBalance,
            netProfit: latestResult.netProfit,
            winRate: latestResult.winRate,
            maxDrawdown: latestResult.maxDrawdown,
            totalTrades: latestResult.totalTrades,
            winningTrades: latestResult.winningTrades,
            losingTrades: latestResult.losingTrades,
            isRunning: false,
            progress: 100
          });
          setShowResults(true);
          toast.success('نتایج قبلی بارگذاری شد');
        } else {
          toast.info('هیچ نتیجه بک‌تستی یافت نشد');
        }
      }
    } catch (error) {
      console.error('Load backtest history error:', error);
      toast.error('خطا در بارگذاری نتایج قبلی');
    }
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="persian-text">بازه زمانی (روز)</Label>
                  <Select 
                    value={backtestSettings.period}
                    onValueChange={(value) => setBacktestSettings({...backtestSettings, period: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 روز</SelectItem>
                      <SelectItem value="7">7 روز</SelectItem>
                      <SelectItem value="30">30 روز</SelectItem>
                      <SelectItem value="90">90 روز</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="persian-text">تایم‌فریم</Label>
                  <Select 
                    value={backtestSettings.timeframe}
                    onValueChange={(value) => setBacktestSettings({...backtestSettings, timeframe: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 دقیقه</SelectItem>
                      <SelectItem value="5m">5 دقیقه</SelectItem>
                      <SelectItem value="15m">15 دقیقه</SelectItem>
                      <SelectItem value="1h">1 ساعت</SelectItem>
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

              {backtestResult && (
                <Button 
                  onClick={() => setShowResults(!showResults)}
                  variant="outline"
                  className="w-full persian-text"
                >
                  <Eye className="w-4 h-4 ml-2" />
                  {showResults ? 'پنهان کردن نتایج' : 'نمایش نتایج'}
                </Button>
              )}
            </CardContent>
          </Card>

          {backtestResult && showResults && (
            <Card>
              <CardHeader>
                <CardTitle className="persian-text">نتایج بک‌تست</CardTitle>
                <CardDescription className="persian-text">
                  عملکرد استراتژی در بازه زمانی انتخاب شده
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label className="persian-text">موجودی اولیه</Label>
                    <p className="text-lg font-semibold">${Number(backtestResult.initialBalance).toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="persian-text">موجودی نهایی</Label>
                    <p className="text-lg font-semibold">${Number(backtestResult.finalBalance).toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="persian-text">سود خالص</Label>
                    <p className={`text-lg font-semibold ${Number(backtestResult.netProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${Number(backtestResult.netProfit).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="persian-text">نرخ برد</Label>
                    <p className="text-lg font-semibold">{Number(backtestResult.winRate).toFixed(2)}%</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="persian-text">حداکثر افت سرمایه</Label>
                    <p className="text-lg font-semibold">{Number(backtestResult.maxDrawdown).toFixed(2)}%</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="persian-text">تعداد معاملات</Label>
                    <p className="text-lg font-semibold">{backtestResult.totalTrades}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="persian-text">معاملات برنده</Label>
                    <p className="text-lg font-semibold text-green-600">{backtestResult.winningTrades}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="persian-text">معاملات بازنده</Label>
                    <p className="text-lg font-semibold text-red-600">{backtestResult.losingTrades}</p>
                  </div>
                </div>

                {backtestResult.isRunning && (
                  <div className="mt-4">
                    <Label className="persian-text">پیشرفت بک‌تست</Label>
                    <Progress value={backtestResult.progress} className="mt-2" />
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      {backtestResult.progress.toFixed(0)}% تکمیل شده
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!backtestResult && (
            <Card>
              <CardHeader>
                <CardTitle className="persian-text">تاریخچه بک‌تست</CardTitle>
                <CardDescription className="persian-text">
                  نتایج بک‌تست‌های قبلی خود را مشاهده کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={loadBacktestHistory}
                  variant="outline"
                  className="w-full persian-text"
                >
                  <Eye className="w-4 h-4 ml-2" />
                  مشاهده آخرین نتایج
                </Button>
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
                          {liveBotStatus.prediction ? (Number(liveBotStatus.prediction) * 100).toFixed(1) + '%' : '--'}
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
                        ${liveBotStatus.profit ? Number(liveBotStatus.profit).toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>

                  <Separator />

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