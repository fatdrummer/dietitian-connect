import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Target, Camera, MessageSquare } from 'lucide-react';

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, profile } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/client/goals', icon: Target, label: 'Goals' },
    { to: '/client/meals', icon: Camera, label: 'Meals' },
    { to: '/client/reflections', icon: MessageSquare, label: 'Reflect' },
  ];

  return (
    <div className="min-h-screen bg-muted/30 pb-20 md:pb-0">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <span className="text-lg font-bold text-primary">NutriTrack</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{profile?.first_name} {profile?.last_name}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-4">{children}</main>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-card md:hidden">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                location.pathname === to ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default ClientLayout;
