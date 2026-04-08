import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DietitianLayout from '@/components/DietitianLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, Utensils, MessageSquare, Target, Plus } from 'lucide-react';

const DietitianDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ clients: 0, meals: 0, reflections: 0, goals: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { count: clientCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('dietitian_id', user.id);

      const { count: mealCount } = await supabase
        .from('meals')
        .select('*', { count: 'exact', head: true });

      const { count: reflectionCount } = await supabase
        .from('reflections')
        .select('*', { count: 'exact', head: true });

      const { count: goalCount } = await supabase
        .from('weekly_goals')
        .select('*', { count: 'exact', head: true });

      setStats({
        clients: clientCount ?? 0,
        meals: mealCount ?? 0,
        reflections: reflectionCount ?? 0,
        goals: goalCount ?? 0,
      });
    };
    fetchStats();
  }, [user]);

  const cards = [
    { title: 'Total Clients', value: stats.clients, icon: Users, link: '/dietitian/clients' },
    { title: 'Meal Uploads', value: stats.meals, icon: Utensils, link: '/dietitian/meals' },
    { title: 'Reflections', value: stats.reflections, icon: MessageSquare, link: '/dietitian/reflections' },
    { title: 'Active Goals', value: stats.goals, icon: Target, link: '/dietitian/clients' },
  ];

  return (
    <DietitianLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your practice</p>
        </div>
        <Button asChild>
          <Link to="/dietitian/clients/new"><Plus className="mr-1.5 h-4 w-4" />New Client</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title, value, icon: Icon, link }) => (
          <Link key={title} to={link}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </DietitianLayout>
  );
};

export default DietitianDashboard;
