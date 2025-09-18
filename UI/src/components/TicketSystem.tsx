import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send,
  Loader2,
  ArrowLeft
} from 'lucide-react';

interface Ticket {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'closed';
  createdAt: string;
  updatedAt: string;
  responses: TicketResponse[];
}

interface TicketResponse {
  id: number;
  message: string;
  sender: 'user' | 'support';
  createdAt: string;
}

export function TicketSystem() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [newTicketForm, setNewTicketForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const API_BASE_URL = '/api/v1';

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
      } else {
        toast.error(data.message || 'خطا در بارگذاری تیکت‌ها');
      }
    } else {
      toast.error('خطا در بارگذاری تیکت‌ها');
    }
  } catch (error) {
    console.error('Load tickets error:', error);
    toast.error('خطا در بارگذاری تیکت‌ها');
  } finally {
    setLoading(false);
  }
};

  // In handleCreateTicket function:
const handleCreateTicket = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newTicketForm.title || !newTicketForm.description || !newTicketForm.category) {
    toast.error('لطفاً تمام فیلدها را پر کنید');
    return;
  }

  try {
    setSending(true);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newTicketForm)
    });

    const data = await response.json(); // Always parse JSON first

    if (response.ok && data.success) {
      setTickets([data.ticket, ...tickets]);
      setNewTicketForm({ title: '', description: '', category: '', priority: 'medium' });
      setShowNewTicket(false);
      toast.success('تیکت شما با موفقیت ایجاد شد');
      
      // Reload tickets to get the full list with proper associations
      loadTickets();
    } else {
      toast.error(data.message || 'خطا در ایجاد تیکت');
    }
  } catch (error) {
    console.error('Create ticket error:', error);
    toast.error('خطا در ایجاد تیکت');
  } finally {
    setSending(false);
  }
};

  // Send message function:
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newMessage.trim() || !selectedTicket) return;

  try {
    setSending(true);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/tickets/${selectedTicket.id}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: newMessage })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        const updatedTickets = tickets.map(ticket => 
          ticket.id === selectedTicket.id 
            ? { 
                ...ticket, 
                responses: [...ticket.responses, data.response],
                updatedAt: new Date().toISOString()
              }
            : ticket
        );

        setTickets(updatedTickets);
        setSelectedTicket({
          ...selectedTicket,
          responses: [...selectedTicket.responses, data.response]
        });
        setNewMessage('');
        toast.success('پیام ارسال شد');
      } else {
        toast.error(data.message || 'خطا در ارسال پیام');
      }
    } else {
      toast.error('خطا در ارسال پیام');
    }
  } catch (error) {
    console.error('Send message error:', error);
    toast.error('خطا در ارسال پیام');
  } finally {
    setSending(false);
  }
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'باز';
      case 'in-progress': return 'در حال بررسی';
      case 'closed': return 'بسته شده';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'فوری';
      case 'medium': return 'متوسط';
      case 'low': return 'کم';
      default: return priority;
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
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت به لیست
          </Button>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={getStatusColor(selectedTicket.status)} className="persian-text text-xs">
              {getStatusText(selectedTicket.status)}
            </Badge>
            <Badge variant={getPriorityColor(selectedTicket.priority)} className="persian-text text-xs">
              {getPriorityText(selectedTicket.priority)}
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
                      {new Date(response.createdAt).toLocaleString('fa-IR')}
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
                  disabled={sending}
                />
                <Button type="submit" size="sm" className="persian-text w-full sm:w-auto" disabled={sending}>
                  {sending ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 ml-2" />
                  )}
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
                disabled={sending}
              />
            </div>

            <div className="space-y-2">
              <Label className="persian-text">دسته‌بندی</Label>
              <Select 
                value={newTicketForm.category}
                onValueChange={(value) => setNewTicketForm({...newTicketForm, category: value})}
                disabled={sending}
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
                disabled={sending}
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
                disabled={sending}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="persian-text" disabled={sending}>
                {sending ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  'ایجاد تیکت'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowNewTicket(false)}
                className="persian-text"
                disabled={sending}
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
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
                        {getStatusText(ticket.status)}
                      </Badge>
                      <Badge variant={getPriorityColor(ticket.priority)} className="persian-text text-xs">
                        {getPriorityText(ticket.priority)}
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
      )}
    </div>
  );
}