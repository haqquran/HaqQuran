import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Home, 
  Book, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Clock, 
  User, 
  Menu, 
  X,
  Moon,
  Sun,
  ShieldCheck
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/src/components/ui/sheet';
import { User as FirebaseUser } from 'firebase/auth';
import { cn } from '@/src/lib/utils';

interface LayoutProps {
  user: FirebaseUser | null;
  isAdmin?: boolean;
}

export default function Layout({ user, isAdmin }: LayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Quran', path: '/quran', icon: Book },
    { name: 'Hadith', path: '/hadith', icon: BookOpen },
    { name: 'Community', path: '/community', icon: Users },
    { name: 'Learning', path: '/learning', icon: GraduationCap },
    { name: 'Prayer', path: '/prayer', icon: Clock },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin', path: '/admin', icon: ShieldCheck });
  }

  const NavContent = () => (
    <div className="flex flex-col h-full bg-emerald-950 text-emerald-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tighter text-emerald-400">HaqQuran</h1>
        <p className="text-xs text-emerald-600 uppercase tracking-widest font-semibold mt-1">Islamic Information Portal</p>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              location.pathname === item.path 
                ? "bg-emerald-800 text-white shadow-lg shadow-emerald-900/50" 
                : "hover:bg-emerald-900/50 text-emerald-400"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-transform group-hover:scale-110",
              location.pathname === item.path ? "text-emerald-300" : "text-emerald-600"
            )} />
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      {user ? (
        <div className="p-4 border-t border-emerald-900/50">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-300 font-bold overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} referrerPolicy="no-referrer" />
              ) : (
                user.displayName?.[0] || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.displayName || 'Muslim Brother/Sister'}</p>
              <p className="text-xs text-emerald-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 border-t border-emerald-900/50">
          <Link to="/auth">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-none">
              Sign In
            </Button>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-slate-200">
        <NavContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header (Mobile) */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-emerald-950 text-emerald-50 border-b border-emerald-900">
          <h1 className="text-xl font-bold text-emerald-400">HaqQuran</h1>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="text-emerald-50 hover:bg-emerald-900">
                <Menu size={24} />
              </Button>
            } />
            <SheetContent side="left" className="p-0 border-none w-72">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
