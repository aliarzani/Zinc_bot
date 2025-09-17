import React, { useState } from 'react';
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
import { toast } from 'sonner@2.0.3';
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
  BarChart3
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
}

export function TradingPanel({ hasApiKeys }: TradingPanelProps) {
  const [backtestSettings, setBacktestSettings] = useState({
    balance: '10000',
    leverage: '1',
    period: '7', // days
    timeframe: '1m'
  });

  const [liveSettings, setLiveSettings] = useState({
    balance: '1000',
    leverage: '1',
    maxRisk: '2'
  });

  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isLiveTrading, setIsLiveTrading] = useState(false);

  const handleBacktest = () => {
    if (!hasApiKeys) {
      toast.error('ابتدا کلیدهای API خود را تنظیم کنید');
      return;
    }

    // Start backtest
    setBacktestResult({
      initialBalance: 0,
      finalBalance: 0,
      netProfit: 0,
      winRate: 0,
      maxDrawdown: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      isRunning: true,
      progress: 0
    });

    // Simulate progress
    const interval = setInterval(() => {
      setBacktestResult(prev => {
        if (!prev) return null;
        const newProgress = prev.progress + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          return {
            initialBalance: parseFloat(backtestSettings.balance),
            finalBalance: 12450.75,
            netProfit: 2450.75,
            winRate: 67.5,
            maxDrawdown: 8.2,
            totalTrades: 148,
            winningTrades: 100,
            losingTrades: 48,
            isRunning: false,
            progress: 100
          };
        }
        return { ...prev, progress: newProgress };
      });
    }, 300);

    toast.success('بک‌تست شروع شد');
  };

  const handleStartLiveTrading = () => {
    if (!hasApiKeys) {
      toast.error('ابتدا کلیدهای API خود را تنظیم کنید');
      return;
    }

    setIsLiveTrading(!isLiveTrading);
    toast.success(isLiveTrading ? 'معاملات زنده متوقف شد' : 'معاملات زنده شروع شد');
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
                  <Label className="persian-text">دوره زمانی (روز)</Label>
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
                  <Label className="persian-text">تایم فریم</Label>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleBacktest} 
                className="w-full persian-text"
                disabled={backtestResult?.isRunning}
              >
                {backtestResult?.isRunning ? 'در حال انجام...' : 'شروع بک‌تست'}
              </Button>
            </CardContent>
          </Card>

          {backtestResult && (
            <Card>
              <CardHeader>
                <CardTitle className="persian-text">نتایج بک‌تست</CardTitle>
              </CardHeader>
              <CardContent>
                {backtestResult.isRunning ? (
                  <div className="space-y-4">
                    <div className="text-center persian-text">
                      <p>در حال تجزیه و تحلیل داده‌ها...</p>
                    </div>
                    <Progress value={backtestResult.progress} className="w-full" />
                    <div className="text-center text-sm text-muted-foreground persian-text">
                      {backtestResult.progress}% تکمیل شده
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center space-y-1">
                        <p className="text-2xl font-bold text-green-600">
                          ${backtestResult.finalBalance.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground persian-text">موجودی نهایی</p>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-2xl font-bold text-primary">
                          +${backtestResult.netProfit.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground persian-text">سود خالص</p>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-2xl font-bold">
                          {backtestResult.winRate}%
                        </p>
                        <p className="text-sm text-muted-foreground persian-text">نرخ برد</p>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-2xl font-bold text-red-600">
                          -{backtestResult.maxDrawdown}%
                        </p>
                        <p className="text-sm text-muted-foreground persian-text">حداکثر ضرر</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-semibold">{backtestResult.totalTrades}</p>
                        <p className="text-sm text-muted-foreground persian-text">کل معاملات</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-green-600">{backtestResult.winningTrades}</p>
                        <p className="text-sm text-muted-foreground persian-text">معاملات سودآور</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-red-600">{backtestResult.losingTrades}</p>
                        <p className="text-sm text-muted-foreground persian-text">معاملات ضررده</p>
                      </div>
                    </div>

                    <Alert className="border-green-200 bg-green-50">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 persian-text">
                        نتایج مثبت! استراتژی در این دوره عملکرد خوبی داشته است.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label className="persian-text">اهرم (Leverage)</Label>
                  <Select 
                    value={liveSettings.leverage}
                    onValueChange={(value) => setLiveSettings({...liveSettings, leverage: value})}
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
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-1">
                  <p className="persian-text">وضعیت ربات:</p>
                  <Badge variant={isLiveTrading ? "default" : "secondary"} className="persian-text">
                    {isLiveTrading ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
                <Button 
                  onClick={handleStartLiveTrading}
                  variant={isLiveTrading ? "destructive" : "default"}
                  className="persian-text"
                >
                  {isLiveTrading ? (
                    <>
                      <Square className="w-4 h-4 ml-2" />
                      توقف ربات
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 ml-2" />
                      شروع معاملات
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLiveTrading && (
            <Card>
              <CardHeader>
                <CardTitle className="persian-text">آمار معاملات زنده</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-xl font-bold">$1,245.30</p>
                    <p className="text-sm text-muted-foreground persian-text">موجودی فعلی</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-green-600">+$245.30</p>
                    <p className="text-sm text-muted-foreground persian-text">سود روزانه</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground persian-text">معاملات امروز</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold">75%</p>
                    <p className="text-sm text-muted-foreground persian-text">نرخ برد</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}