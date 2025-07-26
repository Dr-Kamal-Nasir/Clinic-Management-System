import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FlaskConical, 
  Pill, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  BarChart4,
  UserCog,
  ShoppingCart,
  ClipboardList,
  Layers,
  LayoutDashboardIcon,
  DollarSign,
  ScrollText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/useAuthStore';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  roles: ('admin' | 'ceo' | 'laboratory' | 'pharmacy')[];
  children?: NavItem[];
}

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    laboratory: false,
    pharmacy: false
  });
  
  const pathname = usePathname();
  
  // Use the auth store
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ['admin', 'ceo']
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
      roles: ['admin']
    },
    {
      title: 'Laboratory',
      icon: <FlaskConical className="h-5 w-5" />,
      roles: ['admin', 'ceo', 'laboratory'],
      children: [
        {
          title: 'Dashboard',
          href: '/laboratory/dashboard', // Fixed typo: labratory -> laboratory
          icon: <LayoutDashboardIcon className="h-4 w-4" />,
          roles: ['admin', 'ceo', 'laboratory']
        },
        {
          title: 'Daily Records',
          href: '/laboratory/records',
          icon: <ClipboardList className="h-4 w-4" />,
          roles: ['admin', 'ceo', 'laboratory']
        },
        {
          title: 'Daily Expenses',
          href: '/laboratory/expenses', // Fixed typo: labratory -> laboratory
          icon: <ShoppingCart className="h-4 w-4" />,
          roles: ['admin', 'ceo', 'laboratory']
        }
      ]
    },
    {
      title: 'Pharmacy',
      icon: <Pill className="h-5 w-5" />,
      roles: ['admin', 'ceo', 'pharmacy'],
      children: [
        {
          title: 'Dashboard',
          href: '/pharmacy',
          icon: <LayoutDashboardIcon className="h-4 w-4" />,
          roles: ['admin', 'ceo', 'pharmacy']
        },  
        {
          title: 'Daily Expenses',
          href: '/pharmacy/expenses',
          icon: <ShoppingCart className="h-4 w-4" />,
          roles: ['admin', 'ceo', 'pharmacy']
        },
        {
          title: 'Stock Management',
          href: '/pharmacy/stock',
          icon: <Layers className="h-4 w-4" />,
          roles: ['admin', 'ceo', 'pharmacy']
        },
        {
          title: 'Medicine Issue',
          href: '/pharmacy/issue',
          icon: <Pill className="h-4 w-4" />,
          roles: ['admin', 'ceo', 'pharmacy']
        },
        {
          title: 'Inventory',
          href: '/pharmacy/inventory',
          icon: <ScrollText className="h-4 w-4" />,
          roles: ['admin', 'ceo', 'pharmacy']
        },
        {
          title: 'Cash at Hand',
          href: '/pharmacy/cash',
          icon: <DollarSign className="h-4 w-4" />,
          roles: ['admin', 'ceo', 'pharmacy']
        }
      ]
    },
    {
      title: 'Reports',
      href: '/admin/reports',
      icon: <BarChart4 className="h-5 w-5" />,
      roles: ['admin', 'ceo']
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
      roles: ['admin']
    }
  ];

  // Filter items based on user role
  const filteredItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  // If not authenticated, don't render the sidebar
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <aside 
      className={cn(
        "relative h-screen border-r bg-muted/40 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Sidebar header */}
        <div className={cn(
          "flex items-center border-b p-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <FlaskConical className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold">LabManager</span>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="icon"
            className="ml-auto"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {filteredItems.map((item) => {
              const isActive = item.href && pathname.startsWith(item.href);
              const isGroupActive = item.children?.some(
                child => child.href && pathname.startsWith(child.href)
              );
              
              return (
                <li key={item.title}>
                  {item.children ? (
                    <>
                      <Tooltip delayDuration={0} disableHoverableContent={!collapsed}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                              isGroupActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent"
                            )}
                            onClick={() => toggleGroup(item.title.toLowerCase())}
                          >
                            <span className="flex items-center w-full">
                              {item.icon}
                              {!collapsed && (
                                <>
                                  <span className="ml-3 flex-1">{item.title}</span>
                                  <ChevronRight 
                                    className={cn(
                                      "h-4 w-4 transition-transform",
                                      openGroups[item.title.toLowerCase()] ? "rotate-90" : ""
                                    )} 
                                  />
                                </>
                              )}
                            </span>
                          </div>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                      
                      {!collapsed && openGroups[item.title.toLowerCase()] && (
                        <ul className="mt-1 ml-6 pl-2 space-y-1 border-l border-muted">
                          {item.children
                            .filter(child => user?.role && child.roles.includes(user.role))
                            .map(child => {
                              const isChildActive = child.href && pathname.startsWith(child.href);
                              
                              return (
                                <li key={child.href}>
                                  <Tooltip delayDuration={0} disableHoverableContent={!collapsed}>
                                    <TooltipTrigger asChild>
                                      <Link
                                        href={child.href || '#'}
                                        className={cn(
                                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                          isChildActive
                                            ? "text-primary font-semibold"
                                            : "text-muted-foreground hover:bg-accent"
                                        )}
                                      >
                                        <span className="flex items-center">
                                          {child.icon}
                                          <span className="ml-3">{child.title}</span>
                                        </span>
                                      </Link>
                                    </TooltipTrigger>
                                  </Tooltip>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Tooltip delayDuration={0} disableHoverableContent={!collapsed}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href || '#'}
                          className={cn(
                            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent"
                          )}
                        >
                          <span className="flex items-center">
                            {item.icon}
                            {!collapsed && (
                              <span className="ml-3">{item.title}</span>
                            )}
                          </span>
                        </Link>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile */}
        <div className={cn(
          "border-t p-4",
          collapsed ? "flex justify-center" : ""
        )}>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>
                {user?.name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            {!collapsed && (
              <div className="flex-1 truncate">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role}
                </p>
              </div>
            )}
            
            {!collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/admin/profile">
                    <Button variant="ghost" size="icon">
                      <UserCog className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Profile Settings</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
