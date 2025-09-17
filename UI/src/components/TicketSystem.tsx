import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send
} from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'closed';
  createdAt: string;
  responses: TicketResponse[];
}

interface TicketResponse {
  id: string;
  message: string;
  sender: 'user' | 'support';
  timestamp: string;
}

export function TicketSystem() {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: '1',
      title: 'مشکل در اتصال به API بیت‌فینکس',
      description: 'هنگام وارد کردن کلیدهای API، پیام خطا دریافت می‌کنم',
      category: 'technical',
      priority: 'high',
      status: 'in-progress',
      createdAt: '2024-01-15T10:30:00Z',
      responses: [
        {
          id: '1',
          message: 'سلام، لطفاً بررسی کنید که کلیدهای API شما مجوز معاملات فیوچرز داشته باشند.',
          sender: 'support',
          timestamp: '2024-01-15T11:00:00Z'
        }
      ]
    }
  ]);
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  const [newTicketForm, setNewTicketForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.title || !newTicketForm.description || !newTicketForm.category) {
      toast.error('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    const newTicket: Ticket = {
      id: Date.now().toString(),
      title: newTicketForm.title,
      description: newTicketForm.description,
      category: newTicketForm.category,
      priority: newTicketForm.priority,
      status: 'open',
      createdAt: new Date().toISOString(),
      responses: []
    };

    setTickets([...tickets, newTicket]);
    setNewTicketForm({ title: '', description: '', category: '', priority: 'medium' });
    setShowNewTicket(false);
    toast.success('تیکت شما با موفقیت ایجاد شد');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;

    const newResponse: TicketResponse = {
      id: Date.now().toString(),
      message: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    const updatedTickets = tickets.map(ticket => 
      ticket.id === selectedTicket.id 
        ? { ...ticket, responses: [...ticket.responses, newResponse] }
        : ticket
    );

    setTickets(updatedTickets);
    setSelectedTicket({
      ...selectedTicket,
      responses: [...selectedTicket.responses, newResponse]
    });
    setNewMessage('');
    toast.success('پیام ارسال شد');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'secondary';
      case 'in-progress': return 'default';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={() => setSelectedTicket(null)}
            className="persian-text text-sm"
          >
            بازگشت به لیست
          </Button>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={getStatusColor(selectedTicket.status)} className="persian-text text-xs">
              {selectedTicket.status === 'open' ? 'باز' : 
               selectedTicket.status === 'in-progress' ? 'در حال بررسی' : 'بسته شده'}
            </Badge>
            <Badge variant={getPriorityColor(selectedTicket.priority)} className="persian-text text-xs">
              {selectedTicket.priority === 'high' ? 'فوری' :
               selectedTicket.priority === 'medium' ? 'متوسط' : 'کم'}
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="persian-text text-lg sm:text-xl">{selectedTicket.title}</CardTitle>
            <CardDescription className="persian-text text-sm">
              ایجاد شده در {new Date(selectedTicket.createdAt).toLocaleDateString('fa-IR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-3 sm:p-4 rounded-lg mb-4">
              <p className="persian-text text-sm sm:text-base">{selectedTicket.description}</p>
            </div>

            <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
              {selectedTicket.responses.map((response) => (
                <div
                  key={response.id}
                  className={`flex ${response.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs sm:max-w-sm lg:max-w-md px-3 py-2 rounded-lg ${
                      response.sender === 'user'
                        ? 'bg-primary text-primary-foreground ml-2 sm:ml-4'
                        : 'bg-muted mr-2 sm:mr-4'
                    }`}
                  >
                    <p className="persian-text text-sm">{response.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(response.timestamp).toLocaleString('fa-IR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 sm:mt-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 persian-text text-sm"
                  rows={2}
                />
                <Button type="submit" size="sm" className="persian-text w-full sm:w-auto">
                  <Send className="w-4 h-4 ml-2" />
                  ارسال
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showNewTicket) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="persian-text">ایجاد تیکت جدید</CardTitle>
          <CardDescription className="persian-text">
            مشکل یا سوال خود را با جزئیات شرح دهید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="space-y-2">
              <Label className="persian-text">عنوان</Label>
              <Input
                value={newTicketForm.title}
                onChange={(e) => setNewTicketForm({...newTicketForm, title: e.target.value})}
                placeholder="عنوان مشکل یا سوال خود را وارد کنید"
                className="persian-text"
              />
            </div>

            <div className="space-y-2">
              <Label className="persian-text">دسته‌بندی</Label>
              <Select 
                value={newTicketForm.category}
                onValueChange={(value) => setNewTicketForm({...newTicketForm, category: value})}
              >
                <SelectTrigger className="persian-text">
                  <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical" className="persian-text">مشکل فنی</SelectItem>
                  <SelectItem value="account" className="persian-text">مشکل حساب کاربری</SelectItem>
                  <SelectItem value="trading" className="persian-text">مشکل معاملات</SelectItem>
                  <SelectItem value="billing" className="persian-text">مشکل مالی</SelectItem>
                  <SelectItem value="general" className="persian-text">سوال عمومی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="persian-text">اولویت</Label>
              <Select 
                value={newTicketForm.priority}
                onValueChange={(value) => setNewTicketForm({...newTicketForm, priority: value as any})}
              >
                <SelectTrigger className="persian-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="persian-text">کم</SelectItem>
                  <SelectItem value="medium" className="persian-text">متوسط</SelectItem>
                  <SelectItem value="high" className="persian-text">فوری</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="persian-text">توضیحات</Label>
              <Textarea
                value={newTicketForm.description}
                onChange={(e) => setNewTicketForm({...newTicketForm, description: e.target.value})}
                placeholder="مشکل یا سوال خود را با جزئیات شرح دهید"
                className="persian-text"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="persian-text">
                ایجاد تیکت
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowNewTicket(false)}
                className="persian-text"
              >
                انصراف
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl persian-text">سیستم پشتیبانی</h2>
        <Button onClick={() => setShowNewTicket(true)} className="persian-text text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4 ml-2" />
          تیکت جدید
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="persian-text text-base sm:text-lg">هیچ تیکتی موجود نیست</h3>
                  <p className="text-muted-foreground persian-text text-sm">
                    در صورت نیاز به پشتیبانی، تیکت جدید ایجاد کنید
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:pt-4 sm:px-6" onClick={() => setSelectedTicket(ticket)}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                  <h3 className="persian-text font-medium text-sm sm:text-base">{ticket.title}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={getStatusColor(ticket.status)} className="persian-text text-xs">
                      {ticket.status === 'open' ? 'باز' : 
                       ticket.status === 'in-progress' ? 'در حال بررسی' : 'بسته شده'}
                    </Badge>
                    <Badge variant={getPriorityColor(ticket.priority)} className="persian-text text-xs">
                      {ticket.priority === 'high' ? 'فوری' :
                       ticket.priority === 'medium' ? 'متوسط' : 'کم'}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground persian-text line-clamp-2 mb-3">
                  {ticket.description}
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground gap-2">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="flex items-center gap-1 persian-text">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                    <span className="flex items-center gap-1 persian-text">
                      <MessageSquare className="w-3 h-3" />
                      {ticket.responses.length} پاسخ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}