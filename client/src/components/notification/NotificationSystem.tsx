import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Phone, 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Settings,
  MailOpen,
  ChevronRight,
  Filter,
  Plus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Notification types
type NotificationType = 'info' | 'success' | 'warning' | 'error';
type NotificationChannel = 'inApp' | 'email' | 'mobile' | 'desktop' | 'sms';
type NotificationStatus = 'unread' | 'read' | 'archived';
type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Notification interfaces
interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  channels: NotificationChannel[];
  timestamp: Date;
  status: NotificationStatus;
  priority: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

interface NotificationChannelConfig {
  id: NotificationChannel;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  config?: Record<string, any>;
}

interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  bodyTemplate: string;
  channels: NotificationChannel[];
  variables: string[];
  defaultPriority: NotificationPriority;
  category: string;
}

interface NotificationPreference {
  category: string;
  channels: {
    [key in NotificationChannel]?: boolean;
  };
  enabled: boolean;
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New booking request',
    message: 'You have a new booking request from Sarah Miller for Thursday at 2:00 PM.',
    type: 'info',
    channels: ['inApp', 'email'],
    timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    status: 'unread',
    priority: 'medium',
    actionUrl: '/booking/requests',
    actionLabel: 'View Request',
    sender: {
      id: 'user123',
      name: 'Booking System',
      avatar: '/assets/booking-avatar.png'
    }
  },
  {
    id: '2',
    title: 'Job application approved',
    message: 'Your application for Senior Full Stack Developer at TechNova Inc. has moved to the interview stage.',
    type: 'success',
    channels: ['inApp', 'email', 'mobile'],
    timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
    status: 'unread',
    priority: 'high',
    actionUrl: '/job-board/applications/app123',
    actionLabel: 'View Application',
    sender: {
      id: 'jobboard',
      name: 'Job Board',
      avatar: '/assets/jobboard-avatar.png'
    }
  },
  {
    id: '3',
    title: 'Subscription expiring soon',
    message: 'Your Pro subscription will expire in 5 days. Renew now to avoid service interruption.',
    type: 'warning',
    channels: ['inApp', 'email', 'mobile', 'sms'],
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60000), // 1 day ago
    status: 'read',
    priority: 'high',
    actionUrl: '/settings/subscription',
    actionLabel: 'Renew Now',
    sender: {
      id: 'billing',
      name: 'Billing System',
      avatar: '/assets/billing-avatar.png'
    }
  },
  {
    id: '4',
    title: 'Content published successfully',
    message: 'Your article "10 Tips for Effective Content Marketing" has been published.',
    type: 'success',
    channels: ['inApp'],
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60000), // 3 days ago
    status: 'read',
    priority: 'medium',
    actionUrl: '/cms/articles/art456',
    actionLabel: 'View Article',
    sender: {
      id: 'cms',
      name: 'Content Management',
      avatar: '/assets/cms-avatar.png'
    }
  },
  {
    id: '5',
    title: 'System maintenance scheduled',
    message: 'The system will be undergoing maintenance on June 15, 2025, from 2:00 AM to 4:00 AM UTC. You may experience brief service interruptions.',
    type: 'info',
    channels: ['inApp', 'email'],
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60000), // 5 days ago
    status: 'read',
    priority: 'low',
    sender: {
      id: 'system',
      name: 'System Administrator',
      avatar: '/assets/system-avatar.png'
    }
  },
  {
    id: '6',
    title: 'Security alert',
    message: 'We detected a login to your account from a new device. If this wasn\'t you, please secure your account immediately.',
    type: 'error',
    channels: ['inApp', 'email', 'mobile', 'sms'],
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60000), // 10 days ago
    status: 'archived',
    priority: 'urgent',
    actionUrl: '/settings/security',
    actionLabel: 'Secure Account',
    sender: {
      id: 'security',
      name: 'Security Team',
      avatar: '/assets/security-avatar.png'
    }
  }
];

// Mock notification templates
const mockTemplates: NotificationTemplate[] = [
  {
    id: 'template-1',
    name: 'New Booking Request',
    description: 'Sent when a user receives a new booking request',
    subject: 'New Booking Request from {{requesterName}}',
    bodyTemplate: 'You have a new booking request from {{requesterName}} for {{bookingTime}}.',
    channels: ['inApp', 'email', 'mobile'],
    variables: ['requesterName', 'bookingTime', 'bookingDuration'],
    defaultPriority: 'medium',
    category: 'bookings'
  },
  {
    id: 'template-2',
    name: 'Booking Confirmation',
    description: 'Sent when a booking is confirmed',
    subject: 'Booking Confirmed: {{bookingTitle}}',
    bodyTemplate: 'Your booking {{bookingTitle}} has been confirmed for {{bookingTime}}.',
    channels: ['inApp', 'email', 'mobile', 'sms'],
    variables: ['bookingTitle', 'bookingTime', 'bookingLocation'],
    defaultPriority: 'high',
    category: 'bookings'
  },
  {
    id: 'template-3',
    name: 'Job Application Status Change',
    description: 'Sent when a job application status changes',
    subject: 'Update on Your Job Application: {{jobTitle}}',
    bodyTemplate: 'Your application for {{jobTitle}} at {{companyName}} has been updated to {{newStatus}}.',
    channels: ['inApp', 'email'],
    variables: ['jobTitle', 'companyName', 'newStatus', 'oldStatus'],
    defaultPriority: 'high',
    category: 'job-board'
  },
  {
    id: 'template-4',
    name: 'Content Published',
    description: 'Sent when content is published',
    subject: 'Content Published: {{contentTitle}}',
    bodyTemplate: 'Your content "{{contentTitle}}" has been published successfully.',
    channels: ['inApp', 'email'],
    variables: ['contentTitle', 'contentType', 'publishDate'],
    defaultPriority: 'medium',
    category: 'content'
  },
  {
    id: 'template-5',
    name: 'Subscription Renewal Reminder',
    description: 'Remind users about upcoming subscription renewals',
    subject: 'Your {{planName}} Subscription is Expiring Soon',
    bodyTemplate: 'Your {{planName}} subscription will expire in {{daysLeft}} days. Renew now to avoid service interruption.',
    channels: ['inApp', 'email', 'mobile', 'sms'],
    variables: ['planName', 'daysLeft', 'renewalPrice', 'expiryDate'],
    defaultPriority: 'high',
    category: 'billing'
  }
];

// Mock notification channels
const mockChannels: NotificationChannelConfig[] = [
  {
    id: 'inApp',
    name: 'In-App Notifications',
    description: 'Notifications displayed within the application',
    icon: Bell,
    enabled: true
  },
  {
    id: 'email',
    name: 'Email Notifications',
    description: 'Notifications sent to your email address',
    icon: Mail,
    enabled: true,
    config: {
      emailAddress: 'user@example.com'
    }
  },
  {
    id: 'mobile',
    name: 'Mobile Push Notifications',
    description: 'Notifications sent to your mobile device',
    icon: MessageSquare,
    enabled: false,
    config: {
      deviceToken: 'abc123'
    }
  },
  {
    id: 'desktop',
    name: 'Desktop Notifications',
    description: 'Notifications displayed on your desktop',
    icon: Bell,
    enabled: false
  },
  {
    id: 'sms',
    name: 'SMS Notifications',
    description: 'Text messages sent to your phone number',
    icon: Phone,
    enabled: false,
    config: {
      phoneNumber: '+1 (555) 123-4567'
    }
  }
];

// Mock notification preferences
const mockPreferences: NotificationPreference[] = [
  {
    category: 'bookings',
    channels: {
      inApp: true,
      email: true,
      mobile: true,
      desktop: false,
      sms: false
    },
    enabled: true
  },
  {
    category: 'job-board',
    channels: {
      inApp: true,
      email: true,
      mobile: false,
      desktop: false,
      sms: false
    },
    enabled: true
  },
  {
    category: 'content',
    channels: {
      inApp: true,
      email: false,
      mobile: false,
      desktop: false,
      sms: false
    },
    enabled: true
  },
  {
    category: 'system',
    channels: {
      inApp: true,
      email: true,
      mobile: false,
      desktop: false,
      sms: false
    },
    enabled: true
  },
  {
    category: 'billing',
    channels: {
      inApp: true,
      email: true,
      mobile: true,
      desktop: false,
      sms: true
    },
    enabled: true
  },
  {
    category: 'security',
    channels: {
      inApp: true,
      email: true,
      mobile: true,
      desktop: false,
      sms: true
    },
    enabled: true
  }
];

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>(mockNotifications);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [channels, setChannels] = useState<NotificationChannelConfig[]>(mockChannels);
  const [preferences, setPreferences] = useState<NotificationPreference[]>(mockPreferences);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(mockTemplates);
  const [activeTab, setActiveTab] = useState<string>('inbox');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isChannelSettingsOpen, setIsChannelSettingsOpen] = useState<boolean>(false);
  const [isTemplateDetailsOpen, setIsTemplateDetailsOpen] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);

  const { toast } = useToast();

  // Filter notifications based on search and filters
  useEffect(() => {
    let filtered = [...notifications];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(notification => notification.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(notification => notification.type === typeFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        notification =>
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query)
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setFilteredNotifications(filtered);
  }, [notifications, statusFilter, typeFilter, searchQuery]);

  // Toggle notification status
  const handleToggleStatus = (id: string, newStatus: NotificationStatus) => {
    const updatedNotifications = notifications.map(notification => {
      if (notification.id === id) {
        return { ...notification, status: newStatus };
      }
      return notification;
    });
    
    setNotifications(updatedNotifications);
    
    if (newStatus === 'read' && !notifications.find(n => n.id === id)?.status.includes('read')) {
      toast({
        title: 'Notification marked as read',
        duration: 2000,
      });
    } else if (newStatus === 'archived') {
      toast({
        title: 'Notification archived',
        duration: 2000,
      });
    }
  };

  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Get notification type badge
  const getNotificationTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Info</Badge>;
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Success</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Warning</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">Error</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Info</Badge>;
    }
  };

  // Get notification priority badge
  const getNotificationPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">High</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">Urgent</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Low</Badge>;
    }
  };

  // Get notification channel icon
  const getChannelIcon = (channelId: NotificationChannel) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return <Bell className="h-4 w-4" />;
    
    const Icon = channel.icon;
    return <Icon className="h-4 w-4" />;
  };

  // Toggle channel enabled state
  const handleToggleChannel = (channelId: NotificationChannel, enabled: boolean) => {
    const updatedChannels = channels.map(channel => {
      if (channel.id === channelId) {
        return { ...channel, enabled };
      }
      return channel;
    });
    
    setChannels(updatedChannels);
    
    toast({
      title: `${enabled ? 'Enabled' : 'Disabled'} ${channels.find(c => c.id === channelId)?.name}`,
      duration: 2000,
    });
  };

  // Toggle preference channel
  const handleTogglePreferenceChannel = (category: string, channelId: NotificationChannel, enabled: boolean) => {
    const updatedPreferences = preferences.map(pref => {
      if (pref.category === category) {
        return {
          ...pref,
          channels: {
            ...pref.channels,
            [channelId]: enabled
          }
        };
      }
      return pref;
    });
    
    setPreferences(updatedPreferences);
  };

  // Toggle preference enabled state
  const handleTogglePreference = (category: string, enabled: boolean) => {
    const updatedPreferences = preferences.map(pref => {
      if (pref.category === category) {
        return { ...pref, enabled };
      }
      return pref;
    });
    
    setPreferences(updatedPreferences);
    
    toast({
      title: `${enabled ? 'Enabled' : 'Disabled'} ${category} notifications`,
      duration: 2000,
    });
  };

  // Send test notification
  const handleSendTestNotification = (template: NotificationTemplate) => {
    const testNotification: Notification = {
      id: `test-${Date.now()}`,
      title: template.subject.replace(/{{(\w+)}}/g, (_, varName) => `[Test ${varName}]`),
      message: template.bodyTemplate.replace(/{{(\w+)}}/g, (_, varName) => `[Test ${varName}]`),
      type: 'info',
      channels: template.channels as NotificationChannel[],
      timestamp: new Date(),
      status: 'unread',
      priority: template.defaultPriority,
      sender: {
        id: 'system',
        name: 'Notification System',
      },
      actionUrl: '#',
      actionLabel: 'Test Action',
    };
    
    setNotifications([testNotification, ...notifications]);
    
    toast({
      title: 'Test notification sent',
      description: 'A test notification has been added to your inbox',
      duration: 3000,
    });
  };

  // Get unread count
  const getUnreadCount = () => {
    return notifications.filter(notification => notification.status === 'unread').length;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Manage your notifications and preferences</p>
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Dialog open={isChannelSettingsOpen} onOpenChange={setIsChannelSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Notification Settings</DialogTitle>
                  <DialogDescription>Configure your notification channels and preferences</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="channels" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="channels">Channels</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  </TabsList>
                  <TabsContent value="channels" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      {channels.map((channel) => (
                        <div key={channel.id} className="flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-4">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <channel.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{channel.name}</p>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">{channel.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={channel.enabled}
                            onCheckedChange={(checked) => handleToggleChannel(channel.id, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="preferences" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      {preferences.map((pref) => (
                        <Card key={pref.category}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base capitalize">{pref.category.replace('-', ' ')} Notifications</CardTitle>
                              <Switch
                                checked={pref.enabled}
                                onCheckedChange={(checked) => handleTogglePreference(pref.category, checked)}
                              />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {channels.map((channel) => (
                                <div key={channel.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${pref.category}-${channel.id}`}
                                    checked={pref.channels[channel.id] && pref.enabled && channel.enabled}
                                    disabled={!pref.enabled || !channel.enabled}
                                    onCheckedChange={(checked) => 
                                      handleTogglePreferenceChannel(pref.category, channel.id, !!checked)
                                    }
                                  />
                                  <div className="grid gap-1">
                                    <Label
                                      htmlFor={`${pref.category}-${channel.id}`}
                                      className="text-sm font-normal flex items-center gap-1.5"
                                    >
                                      <channel.icon className="h-3.5 w-3.5" />
                                      <span>{channel.name}</span>
                                    </Label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter className="mt-4">
                  <Button onClick={() => setIsChannelSettingsOpen(false)}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  <span className="hidden md:inline">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setStatusFilter('all')} className={statusFilter === 'all' ? 'bg-accent' : ''}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('unread')} className={statusFilter === 'unread' ? 'bg-accent' : ''}>
                  Unread
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('read')} className={statusFilter === 'read' ? 'bg-accent' : ''}>
                  Read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('archived')} className={statusFilter === 'archived' ? 'bg-accent' : ''}>
                  Archived
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Type</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTypeFilter('all')} className={typeFilter === 'all' ? 'bg-accent' : ''}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('info')} className={typeFilter === 'info' ? 'bg-accent' : ''}>
                  Info
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('success')} className={typeFilter === 'success' ? 'bg-accent' : ''}>
                  Success
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('warning')} className={typeFilter === 'warning' ? 'bg-accent' : ''}>
                  Warning
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('error')} className={typeFilter === 'error' ? 'bg-accent' : ''}>
                  Error
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-background border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="inbox" className="relative">
                Inbox
                {getUnreadCount() > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {getUnreadCount()}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="inbox" className="h-full flex flex-col">
              <div className="p-4 border-b">
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              
              <div className="flex-1 overflow-auto">
                {filteredNotifications.length > 0 ? (
                  <div className="divide-y">
                    {filteredNotifications.map(notification => (
                      <div 
                        key={notification.id}
                        className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors relative ${
                          notification.status === 'unread' ? 'bg-accent/20' : ''
                        }`}
                        onClick={() => {
                          setSelectedNotification(notification);
                          setIsPreviewOpen(true);
                          if (notification.status === 'unread') {
                            handleToggleStatus(notification.id, 'read');
                          }
                        }}
                      >
                        {notification.status === 'unread' && (
                          <div className="absolute left-1.5 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"></div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className="bg-accent/20 dark:bg-accent/10 p-2 rounded-full">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-base truncate">{notification.title}</h4>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {getNotificationTypeBadge(notification.type)}
                              {getNotificationPriorityBadge(notification.priority)}
                              <div className="flex items-center gap-1">
                                {notification.channels.map(channel => (
                                  <span key={channel} className="inline-flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                                    {getChannelIcon(channel)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <MailOpen className="h-12 w-12 text-neutral-300 mb-2" />
                    <h3 className="font-medium text-lg">No notifications found</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-center mt-1 max-w-md">
                      {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'You don\'t have any notifications yet'}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="templates" className="h-full flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-medium text-lg">Notification Templates</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-1">
                      <Plus className="h-4 w-4" />
                      <span>New Template</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create Notification Template</DialogTitle>
                      <DialogDescription>
                        Create a new template for sending notifications
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input id="name" placeholder="Template name" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                          Category
                        </Label>
                        <Select>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bookings">Bookings</SelectItem>
                            <SelectItem value="job-board">Job Board</SelectItem>
                            <SelectItem value="content">Content</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subject" className="text-right">
                          Subject
                        </Label>
                        <Input id="subject" placeholder="Email subject line" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="body" className="text-right pt-2">
                          Body
                        </Label>
                        <Textarea
                          id="body"
                          placeholder="Template content with {{variables}}"
                          className="col-span-3"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">
                          Channels
                        </Label>
                        <div className="col-span-3 space-y-3">
                          {channels.map(channel => (
                            <div key={channel.id} className="flex items-center space-x-2">
                              <Checkbox id={`channel-${channel.id}`} />
                              <Label htmlFor={`channel-${channel.id}`} className="flex items-center gap-1.5 text-sm font-normal">
                                <channel.icon className="h-3.5 w-3.5" />
                                <span>{channel.name}</span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create Template</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                  {templates.map(template => (
                    <Card key={template.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-1 mb-3">
                          <p className="text-sm font-medium">Subject:</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-300">{template.subject}</p>
                        </div>
                        <div className="space-y-1 mb-3">
                          <p className="text-sm font-medium">Category:</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-300 capitalize">{template.category.replace('-', ' ')}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Channels:</p>
                          <div className="flex flex-wrap gap-2">
                            {template.channels.map(channelId => {
                              const channel = channels.find(c => c.id === channelId);
                              if (!channel) return null;
                              return (
                                <Badge key={channelId} variant="secondary" className="text-xs flex items-center gap-1">
                                  <channel.icon className="h-3 w-3" />
                                  <span>{channel.name.replace(' Notifications', '')}</span>
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between border-t pt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsTemplateDetailsOpen(true);
                          }}
                        >
                          View
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleSendTestNotification(template)}
                        >
                          Test
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Notification Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedNotification.title}</DialogTitle>
                  {getNotificationTypeBadge(selectedNotification.type)}
                </div>
                <DialogDescription>
                  Received {formatTimestamp(selectedNotification.timestamp)}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-base mb-6">
                  {selectedNotification.message}
                </p>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-neutral-500 dark:text-neutral-400">Priority</p>
                    <p className="capitalize">{selectedNotification.priority}</p>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-500 dark:text-neutral-400">Sender</p>
                    <p>{selectedNotification.sender?.name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-500 dark:text-neutral-400">Status</p>
                    <p className="capitalize">{selectedNotification.status}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="font-medium text-sm text-neutral-500 dark:text-neutral-400">Delivery channels</p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {selectedNotification.channels.map(channel => {
                      const channelData = channels.find(c => c.id === channel);
                      if (!channelData) return null;
                      return (
                        <Badge key={channel} variant="secondary" className="text-xs flex items-center gap-1">
                          <channelData.icon className="h-3 w-3" />
                          <span>{channelData.name.replace(' Notifications', '')}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter className="flex justify-between items-center gap-2">
                <div>
                  {selectedNotification.status !== 'archived' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        handleToggleStatus(selectedNotification.id, 'archived');
                        setIsPreviewOpen(false);
                      }}
                    >
                      Archive
                    </Button>
                  )}
                </div>
                <div>
                  <Button onClick={() => setIsPreviewOpen(false)} variant="secondary" className="mr-2">
                    Close
                  </Button>
                  {selectedNotification.actionUrl && selectedNotification.actionLabel && (
                    <Button>
                      {selectedNotification.actionLabel}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Template Details Dialog */}
      <Dialog open={isTemplateDetailsOpen} onOpenChange={setIsTemplateDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name}</DialogTitle>
                <DialogDescription>{selectedTemplate.description}</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Subject:</p>
                  <p className="text-base bg-accent/50 p-2 rounded">{selectedTemplate.subject}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Template Body:</p>
                  <div className="bg-accent/50 p-2 rounded">
                    <p className="text-base whitespace-pre-line">{selectedTemplate.bodyTemplate}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Category:</p>
                    <p className="capitalize">{selectedTemplate.category.replace('-', ' ')}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Default Priority:</p>
                    <p className="capitalize">{selectedTemplate.defaultPriority}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map(variable => (
                      <Badge key={variable} variant="outline" className="bg-accent/30">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Channels:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.channels.map(channelId => {
                      const channel = channels.find(c => c.id === channelId);
                      if (!channel) return null;
                      return (
                        <Badge key={channelId} variant="secondary" className="flex items-center gap-1">
                          <channel.icon className="h-3 w-3" />
                          <span>{channel.name.replace(' Notifications', '')}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTemplateDetailsOpen(false)}>Close</Button>
                <Button onClick={() => {
                  handleSendTestNotification(selectedTemplate);
                  setIsTemplateDetailsOpen(false);
                }}>
                  Send Test Notification
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}