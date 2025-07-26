'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  title: string;
  href: string;
}

interface SidebarProps {
  items: SidebarItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  className?: string;
}

export function Sidebar({ items, isOpen, setIsOpen, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("fixed top-4 left-4 z-50 md:hidden", className)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="px-0 w-[250px]">
        <div className="space-y-4 py-4">
          <div className="px-4 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Laboratory
            </h2>
            <div className="space-y-1">
              {items.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href} onClick={() => setIsOpen(false)}>
                    {item.title}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
