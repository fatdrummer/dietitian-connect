import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Utensils, MessageSquare, Target } from 'lucide-react';

const DietitianLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dietitian" className="text-xl font-bold text-primary">NutriTrack</Link>
            <nav className="hidden items-center gap-1 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dietitian"><Users className="mr-1.5 h-4 w-4" />Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dietitian/clients"><Users className="mr-1.5 h-4 w-4" />Clients</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dietitian/meals"><Utensils className="mr-1.5 h-4 w-4" />Meals</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dietitian/reflections"><MessageSquare className="mr-1.5 h-4 w-4" />Reflections</Link>
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:block">{profile?.first_name} {profile?.last_name}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
};

export default DietitianLayout;
