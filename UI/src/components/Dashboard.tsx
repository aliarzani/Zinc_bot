import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Badge } from './ui/badge';
import { ApiKeyManager } from './ApiKeyManager';
import { TradingPanel } from './TradingPanel';
import { TicketSystem } from './TicketSystem';
import { AboutPage } from './AboutPage';
import { 
  Menu, 
  LogOut, 
  Settings, 
  TrendingUp, 
  Activity, 
  Wallet,
  HelpCircle,
  Info
} from 'lucide-react';

interface DashboardProps {
  user: { name: string; email: string } | null;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentView, setCurrentView] = useState('trading');
  const [hasApiKeys, setHasApiKeys] = useState(false);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'trading':
        return <TradingPanel hasApiKeys={hasApiKeys} />;
      case 'api-keys':
        return <ApiKeyManager onApiKeysChange={setHasApiKeys} />;
      case 'tickets':
        return <TicketSystem />;
      case 'about':
        return <AboutPage />;
      default:
        return <TradingPanel hasApiKeys={hasApiKeys} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl persian-title">زینک بات</h1>
              <p className="text-xs sm:text-sm text-muted-foreground persian-text">
                خوش آمدید، {user?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 space-x-reverse">
            <Badge variant={hasApiKeys ? "default" : "secondary"} className="persian-text text-xs hidden sm:inline-flex">
              {hasApiKeys ? 'متصل به Bitfinex' : 'در انتظار اتصال'}
            </Badge>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="persian-text">منو</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Button
                    variant={currentView === 'about' ? 'default' : 'ghost'}
                    className="w-full justify-start persian-text"
                    onClick={() => setCurrentView('about')}
                  >
                    <Info className="ml-2 h-4 w-4" />
                    درباره زینک بات
                  </Button>
                  <Button
                    variant={currentView === 'tickets' ? 'default' : 'ghost'}
                    className="w-full justify-start persian-text"
                    onClick={() => setCurrentView('tickets')}
                  >
                    <HelpCircle className="ml-2 h-4 w-4" />
                    سیستم تیکت
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive persian-text"
                    onClick={onLogout}
                  >
                    <LogOut className="ml-2 h-4 w-4" />
                    خروج از حساب
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-6">
        {/* Navigation Tabs */}
        <div className="mb-4 sm:mb-6">
          <Tabs value={currentView} onValueChange={setCurrentView} className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-sm sm:max-w-md mx-auto h-9 sm:h-10">
              <TabsTrigger value="trading" className="persian-text text-xs sm:text-sm px-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                معاملات
              </TabsTrigger>
              <TabsTrigger value="api-keys" className="persian-text text-xs sm:text-sm px-2">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                تنظیمات
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="persian-text text-xs sm:text-sm px-2">
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                پرتفولیو
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Dynamic Content */}
        <div className="w-full max-w-6xl mx-auto">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
}