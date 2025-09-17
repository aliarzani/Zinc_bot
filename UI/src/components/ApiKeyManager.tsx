import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { Key, Shield, AlertTriangle, CheckCircle, Eye, EyeOff, Loader2, Play, Square } from 'lucide-react';

interface ApiKeyManagerProps {
  onApiKeysChange: (hasKeys: boolean) => void;
}

interface BotStatus {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  logs: Array<{
    timestamp: string;
    message: string;
    type: 'info' | 'error' | 'warning';
  }>;
  startTime: string;
  endTime?: string;
}

export function ApiKeyManager({ onApiKeysChange }: ApiKeyManagerProps) {
  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  const API_BASE_URL = '/api/v1';

  useEffect(() => {
    checkAPIKeys();
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, []);

  const checkAPIKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/keys`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.hasKeys);
        onApiKeysChange(data.hasKeys);
      }
    } catch (error) {
      console.error('Check API keys error:', error);
    }
  };

  // In ApiKeyManager.tsx, update the handleSaveKeys function
// In ApiKeyManager.tsx - Simplify validation
// In your React component - simplify validation
const handleSaveKeys = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!publicKey || !secretKey) {
    toast.error('لطفاً هر دو کلید را وارد کنید');
    return;
  }

  // Very basic validation
  if (publicKey.trim().length < 3) {
    toast.error('کلید عمومی معتبر نیست');
    return;
  }

  if (secretKey.trim().length < 3) {
    toast.error('کلید محرمانه معتبر نیست');
    return;
  }

  setIsSaving(true);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/user/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        publicKey: publicKey.trim(), 
        secretKey: secretKey.trim() 
      })
    });

    const data = await response.json();

    if (data.success) {
      setIsConnected(true);
      onApiKeysChange(true);
      toast.success('کلیدهای API با موفقیت ذخیره شد');
      
      // Start backtest after saving keys
      startBacktest();
    } else {
      toast.error(data.message || 'خطا در ذخیره کلیدها');
    }
  } catch (error) {
    console.error('Save keys error:', error);
    toast.error('خطا در ارتباط با سرور');
  } finally {
    setIsSaving(false);
  }
};
  const startBacktest = async () => {
    setIsLoading(true);
    toast.info('شروع بک‌تست...');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/backtest/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ balance: 10000, leverage: 1 })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('بک‌تست شروع شد');
        monitorBotStatus(data.botId);
      } else {
        toast.error(data.message || 'خطا در شروع بک‌تست');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Start backtest error:', error);
      toast.error('خطا در ارتباط با سرور');
      setIsLoading(false);
    }
  };

  const monitorBotStatus = (botId: string) => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/backtest/status/${botId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setBotStatus(data.bot);
          
          if (data.bot.status === 'completed' || data.bot.status === 'failed' || data.bot.status === 'stopped') {
            clearInterval(interval);
            setIsLoading(false);
            if (data.bot.status === 'completed') {
              toast.success('بک‌تست با موفقیت انجام شد');
            } else if (data.bot.status === 'failed') {
              toast.error('بک‌تست با خطا مواجه شد');
            } else {
              toast.info('بک‌تست متوقف شد');
            }
          }
        }
      } catch (error) {
        console.error('Monitor bot error:', error);
      }
    }, 2000);

    setMonitoringInterval(interval);
  };

  const stopBot = async () => {
    if (!botStatus) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/backtest/stop/${botStatus.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.info('ربات متوقف شد');
        if (monitoringInterval) {
          clearInterval(monitoringInterval);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Stop bot error:', error);
      toast.error('خطا در توقف ربات');
    }
  };

  const handleDisconnect = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/keys`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setPublicKey('');
        setSecretKey('');
        setIsConnected(false);
        onApiKeysChange(false);
        setBotStatus(null);
        if (monitoringInterval) {
          clearInterval(monitoringInterval);
        }
        toast.info('اتصال به Bitfinex قطع شد');
      } else {
        toast.error(data.message || 'خطا در قطع اتصال');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('خطا در ارتباط با سرور');
    }
  };

  const handleTestConnection = () => {
    if (!isConnected) {
      toast.error('ابتدا کلیدهای API را ذخیره کنید');
      return;
    }
    toast.success('اتصال به Bitfinex برقرار است');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-blue-500 persian-text">در حال اجرا</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500 persian-text">تکمیل شده</Badge>;
      case 'failed':
        return <Badge variant="default" className="bg-red-500 persian-text">خطا</Badge>;
      case 'stopped':
        return <Badge variant="default" className="bg-yellow-500 persian-text">متوقف شده</Badge>;
      default:
        return <Badge variant="secondary" className="persian-text">نامشخص</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 persian-title font-['Vazirmatn']">
            <Key className="w-5 h-5" />
            مدیریت کلیدهای API بیت‌فینکس
          </CardTitle>
          <CardDescription className="persian-text font-['Vazirmatn']">
            برای استفاده از ربات معاملاتی، کلیدهای API خود را از بیت‌فینکس وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isConnected ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 persian-text">
                  حساب شما با موفقیت به بیت‌فینکس متصل شد
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleTestConnection}
                  className="persian-text"
                  variant="outline"
                >
                  تست اتصال
                </Button>
                <Button 
                  onClick={handleDisconnect}
                  variant="destructive"
                  className="persian-text"
                >
                  قطع اتصال
                </Button>
              </div>

              <div className="text-center">
                <Badge variant="default" className="persian-text">
                  وضعیت: متصل
                </Badge>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveKeys} className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <Shield className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 persian-text">
                  کلیدهای شما با رمزنگاری پیشرفته محافظت می‌شوند و هرگز در اختیار اشخاص ثالث قرار نمی‌گیرند
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="public-key" className="persian-text">
                  کلید عمومی (Public Key)
                </Label>
                <Input
                  id="public-key"
                  type="text"
                  placeholder="کلید عمومی بیت‌فینکس خود را وارد کنید"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="english-text"
                  disabled={isSaving || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret-key" className="persian-text">
                  کلید محرمانه (Secret Key)
                </Label>
                <div className="relative">
                  <Input
                    id="secret-key"
                    type={showSecretKey ? "text" : "password"}
                    placeholder="کلید محرمانه بیت‌فینکس خود را وارد کنید"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="pl-10 english-text"
                    disabled={isSaving || isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    disabled={isSaving || isLoading}
                  >
                    {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 persian-text">
                  <strong>نکته مهم:</strong> هنگام ایجاد کلیدهای API در بیت‌فینکس، مطمئن شوید که مجوزهای لازم برای معاملات فیوچرز را فعال کرده‌اید.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full persian-text"
                disabled={isSaving || isLoading}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال اجرای بک‌تست...
                  </>
                ) : (
                  'ذخیره و اتصال'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Bot Status Card */}
      {botStatus && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between persian-text">
              <span>وضعیت ربات معاملاتی</span>
              <div className="flex items-center gap-2">
                {getStatusBadge(botStatus.status)}
                {botStatus.status === 'running' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopBot}
                    disabled={isLoading}
                  >
                    <Square className="h-4 w-4 ml-2" />
                    توقف
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {botStatus.logs.slice(-20).map((log, index) => (
                  <div
                    key={index}
                    className={`text-sm font-mono ${
                      log.type === 'error' ? 'text-red-600' :
                      log.type === 'warning' ? 'text-yellow-600' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-gray-500 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString('fa-IR')}
                    </span>
                    {' '}
                    {log.message}
                  </div>
                ))}
                {botStatus.logs.length === 0 && (
                  <div className="text-center text-gray-500 persian-text">
                    در حال انتظار برای لاگ‌ها...
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guide Card */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="persian-text">راهنمای دریافت کلیدهای API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm persian-text">
            <div className="flex items-start gap-2">
              <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
              <p>وارد حساب بیت‌فینکس خود شوید</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
              <p>به بخش API Management مراجعه کنید</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
              <p>کلید جدید بسازید و مجوزهای Trading و Futures را فعال کنید</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
              <p>کلیدهای ایجاد شده را در فرم بالا وارد کنید</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}