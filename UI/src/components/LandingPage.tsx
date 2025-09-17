import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { CandlestickChart } from './CandlestickChart';

interface LandingPageProps {
  onLogin: (user: { name: string; email: string }, token: string) => void; // Add token parameter
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
  };
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = '/api/v1';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

if (data.success) {
  localStorage.setItem('token', data.token);
  toast.success('با موفقیت وارد شدید');
  onLogin({ name: data.user.name, email: data.user.email }, data.token); // Add token here
} else {
        toast.error('ایمیل یا رمز عبور اشتباه است');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !acceptTerms) {
      toast.error('لطفاً تمام فیلدها را پر کنید و شرایط را بپذیرید');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data: AuthResponse = await response.json();

      if (data.success) {
  localStorage.setItem('token', data.token);
  toast.success('حساب کاربری با موفقیت ایجاد شد');
  onLogin({ name: data.user.name, email: data.user.email }, data.token); // Add token here
} else {
        toast.error('ایمیل قبلاً ثبت شده است');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('لطفاً ابتدا ایمیل خود را وارد کنید');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgotpassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('لینک بازیابی رمز عبور به ایمیل شما ارسال شد');
      } else {
        toast.error('خطا در ارسال ایمیل بازیابی');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('خطا در ارتباط با سرور');
    }
  };

  const handleGoogleLogin = () => {
    toast.info('ورود با گوگل به زودی اضافه خواهد شد');
  };

  return (
    <div className="min-h-screen relative bg-background">
      {/* Simple, clean background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background to-primary/3"></div>

      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              <CandlestickChart className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl persian-title">
              زینک بات
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-sm sm:max-w-md mx-auto leading-relaxed persian-title-center px-4">
              پلتفرم هوشمند معاملات خودکار ارزهای دیجیتال با الگوریتم‌های پیشرفته یادگیری عمیق
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-primary/70">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="persian-text">آماده برای معاملات زنده</span>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-sm sm:max-w-md shadow-lg border-primary/20 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2 pb-4">
            <CardTitle className="persian-title text-lg sm:text-xl">ورود به حساب کاربری</CardTitle>
            <CardDescription className="persian-text text-sm">
              برای دسترسی به پنل معاملات هوشمند وارد شوید
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-muted/50">
                <TabsTrigger value="signin" className="persian-text text-sm">ورود</TabsTrigger>
                <TabsTrigger value="signup" className="persian-text text-sm">ثبت نام</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="persian-text">آدرس ایمیل</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="ایمیل خود را وارد کنید"
                        className="pr-10 bg-white/80 border-primary/20 focus:border-primary transition-all text-left"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        dir="ltr"
                        style={{ textAlign: 'left' }}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="persian-text">رمز عبور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="رمز عبور خود را وارد کنید"
                        className="pr-10 persian-input-placeholder bg-white/80 border-primary/20 focus:border-primary transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ direction: 'rtl', textAlign: 'right' }}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <Button
                      type="button"
                      variant="link"
                      className="text-primary p-0 rtl-text hover:text-primary/80 transition-colors text-sm"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                    >
                      فراموشی رمز عبور؟
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <Button 
                      type="submit" 
                      className="w-full persian-text bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          در حال ورود...
                        </>
                      ) : (
                        <>
                          ورود به پنل
                          <ArrowRight className="mr-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full persian-text border-primary/30 hover:bg-primary/5 transition-all duration-300"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      <Mail className="ml-2 h-4 w-4" />
                      ورود سریع با Google
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="persian-text">نام و نام خانوادگی</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="نام کامل خود را وارد کنید"
                        className="pr-10 persian-input-placeholder bg-white/80 border-primary/20 focus:border-primary transition-all"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ direction: 'rtl', textAlign: 'right' }}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="persian-text">آدرس ایمیل</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="ایمیل خود را وارد کنید"
                        className="pr-10 bg-white/80 border-primary/20 focus:border-primary transition-all text-left"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        dir="ltr"
                        style={{ textAlign: 'left' }}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="persian-text">رمز عبور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="رمز عبور قوی انتخاب کنید"
                        className="pr-10 persian-input-placeholder bg-white/80 border-primary/20 focus:border-primary transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ direction: 'rtl', textAlign: 'right' }}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      className="mt-1 flex-shrink-0"
                      disabled={isLoading}
                    />
                    <div className="text-sm rtl-text leading-relaxed text-right">
                      با{' '}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="text-primary underline hover:text-primary/80 transition-colors">
                            شرایط و ضوابط و خط‌مشی حریم خصوصی
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="persian-title text-xl">شرایط و ضوابط استفاده</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6 text-sm persian-text leading-relaxed">
                            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                              <h3 className="font-bold text-red-800 mb-2">⚠️ هشدار مهم در مورد ریسک‌های معاملاتی</h3>
                              <p className="text-red-700">
                                استفاده از ربات‌های معاملاتی خودکار دارای ریسک‌های بالایی است. بازار ارزهای دیجیتال بسیار نوسان‌پذیر بوده و 
                                ممکن است منجر به ضرر کامل سرمایه شود. هیچ‌گونه تضمینی برای سودآوری وجود ندارد و عملکرد گذشته نشان‌دهنده 
                                نتایج آینده نیست.
                              </p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                              <h3 className="font-bold text-blue-800 mb-2">🔒 امنیت و حفاظت از اطلاعات</h3>
                              <p className="text-blue-700">
                                تمامی کلیدهای API شما با بالاترین استانداردهای امنیتی و رمزنگاری پیشرفته محافظت می‌شوند. 
                                ما هیچ‌گاه کلیدهای شما را ذخیره، لاگ یا در اختیار اشخاص ثالث قرار نمی‌دهیم. تمامی ارتباطات از طریق 
                                پروتکل‌های امن انجام می‌شود.
                              </p>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                              <h3 className="font-bold text-yellow-800 mb-2">⚖️ مسئولیت و تعهدات</h3>
                              <p className="text-yellow-700">
                                شما کاملاً مسئول تصمیمات سرمایه‌گذاری و نتایج معاملات خودتان هستید. این نرم‌افزار به عنوان ابزار کمکی 
                                ارائه می‌شود و شرکت ما هیچ‌گونه مسئولیتی در قبال ضررهای مالی نخواهد داشت. لطفاً فقط با سرمایه‌ای معامله 
                                کنید که از دست دادن آن را تحمل می‌کنید.
                              </p>
                            </div>
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                              <h3 className="font-bold text-green-800 mb-2">📞 پشتیبانی و خدمات</h3>
                              <p className="text-green-700">
                                تیم پشتیبانی ما آماده کمک به شما در مورد مسائل فنی و راهنمایی استفاده از نرم‌افزار است. 
                                در صورت بروز هر مشکل، از طریق سیستم تیکت داخل برنامه با ما در تماس باشید. پاسخ‌گویی به تیکت‌ها 
                                در کمتر از ۲۴ ساعت انجام می‌شود.
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground mt-6 pt-4 border-t">
                              <p>آخرین بروزرسانی: دی ماه ۱۴۰۳</p>
                              <p>نسخه: ۱.۰.۰</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {' '}موافق هستم
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <Button 
                      type="submit" 
                      className="w-full persian-text bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          در حال ایجاد حساب...
                        </>
                      ) : (
                        <>
                          ایجاد حساب کاربری
                          <ArrowRight className="mr-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full persian-text border-primary/30 hover:bg-primary/5 transition-all duration-300"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      <Mail className="ml-2 h-4 w-4" />
                      ثبت نام سریع با Google
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 sm:mt-8 text-center text-sm text-muted-foreground space-y-2 px-4">
          <p className="persian-text">
            © ۱۴۰۳ زینک بات. تمامی حقوق محفوظ است.
          </p>
          <p className="persian-text text-xs">
            ساخته شده با ❤️ برای معامله‌گران ایرانی
          </p>
        </div>
      </div>
    </div>
  );
}