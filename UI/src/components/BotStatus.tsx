// src/components/BotStatus.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { Play, Square, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';

interface BotStatusProps {
  botId: string;
}

interface BotLog {
  timestamp: Date;
  message: string;
  type: 'info' | 'error' | 'warning';
}

export function BotStatus({ botId }: BotStatusProps) {
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [status, setStatus] = useState<'running' | 'completed' | 'failed' | 'stopped'>('running');
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = '/api/v1';

  useEffect(() => {
    if (botId) {
      monitorBotStatus();
    }
  }, [botId]);

  const monitorBotStatus = async () => {
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
          setLogs(data.bot.logs);
          setStatus(data.bot.status);
          
          if (data.bot.status !== 'running') {
            clearInterval(interval);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Monitor bot error:', error);
      }
    }, 1000);
  };

  const stopBot = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/backtest/stop/${botId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.info('ربات متوقف شد');
        setStatus('stopped');
      }
    } catch (error) {
      console.error('Stop bot error:', error);
      toast.error('خطا در توقف ربات');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'stopped': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'stopped': return <Square className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="persian-text">وضعیت ربات معاملاتی</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusColor(status)}>
              {getStatusIcon(status)}
              <span className="mr-2 persian-text">
                {status === 'running' && 'در حال اجرا'}
                {status === 'completed' && 'تکمیل شده'}
                {status === 'failed' && 'خطا'}
                {status === 'stopped' && 'متوقف شده'}
              </span>
            </Badge>
            {status === 'running' && (
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
        <CardDescription className="persian-text">
          لاگ‌های زنده ربات معاملاتی
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 rounded-md border p-4">
          <div className="space-y-2">
            {logs.map((log, index) => (
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
            {logs.length === 0 && (
              <div className="text-center text-gray-500 persian-text">
                هیچ لاگی موجود نیست
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}