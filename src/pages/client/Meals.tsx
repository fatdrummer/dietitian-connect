import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/components/ClientLayout';
import MealGrid from '@/components/MealGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const ClientMeals = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Tables<'meals'>[]>([]);
  const [comments, setComments] = useState<Tables<'meal_comments'>[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<Tables<'weekly_goals'> | null>(null);
  const [periodOffset, setPeriodOffset] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: wg } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('client_id', user.id)
        .lte('start_date', today)
        .or(`end_date.gte.${today},end_date.is.null`)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();
      setWeeklyGoals(wg);

      const { data: m } = await supabase.from('meals').select('*').eq('client_id', user.id).order('meal_date', { ascending: true });
      setMeals(m ?? []);

      const mealIds = (m ?? []).map((meal) => meal.id);
      if (mealIds.length > 0) {
        const { data: c } = await supabase.from('meal_comments').select('*').in('meal_id', mealIds);
        setComments(c ?? []);
      }
    };
    fetchData();
  }, [user]);

  const getPeriodStart = (): string => {
    if (!weeklyGoals) {
      // Fallback: use current Monday
      const today = new Date();
      const day = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((day + 6) % 7) + periodOffset * 7);
      return monday.toISOString().split('T')[0];
    }
    const start = new Date(weeklyGoals.start_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const currentPeriodIndex = Math.floor(diffDays / 7);
    const targetIndex = currentPeriodIndex + periodOffset;
    const periodStart = new Date(start);
    periodStart.setDate(start.getDate() + targetIndex * 7);
    return periodStart.toISOString().split('T')[0];
  };

  const periodStart = getPeriodStart();

  // Filter meals for the current 7-day period
  const periodEnd = (() => {
    const ps = new Date(periodStart + 'T00:00:00');
    ps.setDate(ps.getDate() + 6);
    return ps.toISOString().split('T')[0];
  })();

  const periodMeals = meals.filter(
    (m) => m.meal_date && m.meal_date >= periodStart && m.meal_date <= periodEnd
  );

  return (
    <ClientLayout>
      <h1 className="text-xl font-bold mb-4">Meals</h1>

      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setPeriodOffset((p) => p - 1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium">
          {periodStart} — {periodEnd}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setPeriodOffset((p) => p + 1)} disabled={periodOffset >= 0}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <MealGrid meals={periodMeals} comments={comments} periodStart={periodStart} />
        </CardContent>
      </Card>
    </ClientLayout>
  );
};

export default ClientMeals;
