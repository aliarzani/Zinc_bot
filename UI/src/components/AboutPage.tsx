import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Bot, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3,
  Settings,
  Clock,
  Star
} from 'lucide-react';

export function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto">
          <Bot className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl persian-title font-['Vazirmatn']">زینک بات</h1>
          <p className="text-muted-foreground persian-text font-['Vazirmatn'] mt-2">
            ربات هوشمند معاملات ارزهای دیجیتال
          </p>
          <Badge variant="secondary" className="mt-3 persian-text">
            نسخه 1.0.0
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="persian-text">درباره زینک بات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="persian-text leading-relaxed">
            زینک بات یک سیستم معاملاتی خودکار پیشرفته است که با استفاده از الگوریتم‌های یادگیری عمیق و هوش مصنوعی، 
            معاملات ارزهای دیجیتال را در بورس بیت‌فینکس انجام می‌دهد. این ربات قادر است الگوهای پیچیده بازار را تشخیص داده و 
            تصمیمات معاملاتی هوشمندانه اتخاذ کند.
          </p>
          
          <Separator />
          
          <div>
            <h3 className="persian-text mb-3">ویژگی‌های کلیدی:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="persian-text font-medium">تحلیل هوشمند</h4>
                  <p className="text-sm text-muted-foreground persian-text">
                    تحلیل الگوهای بازار با استفاده از یادگیری عمیق
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="persian-text font-medium">امنیت بالا</h4>
                  <p className="text-sm text-muted-foreground persian-text">
                    رمزنگاری کلیدهای API و حفاظت از اطلاعات
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="persian-text font-medium">سرعت بالا</h4>
                  <p className="text-sm text-muted-foreground persian-text">
                    اجرای سریع معاملات در تایم‌فریم 1 دقیقه
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="persian-text font-medium">بک‌تست دقیق</h4>
                  <p className="text-sm text-muted-foreground persian-text">
                    تست استراتژی روی داده‌های تاریخی
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="persian-text">نحوه کار ربات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                1
              </span>
              <div>
                <h4 className="persian-text font-medium">جمع‌آوری داده‌ها</h4>
                <p className="text-sm text-muted-foreground persian-text">
                  دریافت داده‌های قیمت Bitcoin از API بیت‌فینکس در تایم‌فریم 1 دقیقه
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                2
              </span>
              <div>
                <h4 className="persian-text font-medium">محاسبه شاخص‌ها</h4>
                <p className="text-sm text-muted-foreground persian-text">
                  محاسبه RSI، میانگین متحرک، حجم معاملات و سایر اندیکاتورهای تکنیکال
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                3
              </span>
              <div>
                <h4 className="persian-text font-medium">پیش‌بینی</h4>
                <p className="text-sm text-muted-foreground persian-text">
                  استفاده از مدل یادگیری عمیق برای پیش‌بینی جهت حرکت قیمت
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                4
              </span>
              <div>
                <h4 className="persian-text font-medium">اجرای معامله</h4>
                <p className="text-sm text-muted-foreground persian-text">
                  باز و بسته کردن پوزیشن‌ها بر اساس سیگنال‌های تولید شده
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="persian-text">مشخصات فنی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <h4 className="persian-text font-medium">الگوریتم یادگیری</h4>
                <p className="text-sm text-muted-foreground">Deep Learning Classifier</p>
              </div>
              <div>
                <h4 className="persian-text font-medium">تایم‌فریم</h4>
                <p className="text-sm text-muted-foreground">1 دقیقه، 5 دقیقه، 15 دقیقه</p>
              </div>
              <div>
                <h4 className="persian-text font-medium">بورس پشتیبانی شده</h4>
                <p className="text-sm text-muted-foreground">Bitfinex</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="persian-text font-medium">ارزهای پشتیبانی شده</h4>
                <p className="text-sm text-muted-foreground">Bitcoin (BTC/USDT)</p>
              </div>
              <div>
                <h4 className="persian-text font-medium">نوع معاملات</h4>
                <p className="text-sm text-muted-foreground">Futures Trading</p>
              </div>
              <div>
                <h4 className="persian-text font-medium">اهرم پشتیبانی شده</h4>
                <p className="text-sm text-muted-foreground">1x تا 5x</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="persian-text">هشدارهای مهم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-800 persian-text">
              <strong>ریسک سرمایه‌گذاری:</strong> معاملات ارزهای دیجیتال دارای ریسک بالا است و ممکن است منجر به از دست دادن کل سرمایه شود.
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800 persian-text">
              <strong>هیچ تضمینی وجود ندارد:</strong> عملکرد گذشته نشان‌دهنده نتایج آینده نیست و هیچ تضمینی برای سود وجود ندارد.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-blue-800 persian-text">
              <strong>استفاده مسئولانه:</strong> فقط با سرمایه‌ای معامله کنید که از دست دادن آن را تحمل می‌کنید.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="persian-text">تماس با ما</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="persian-text">
            برای پشتیبانی، گزارش مشکل یا پیشنهادات، از طریق سیستم تیکت با ما در تماس باشید.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}