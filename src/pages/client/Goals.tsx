import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/components/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import type { WeeklyGoalItem } from '@/types';

const ClientGoals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weeklyGoals, setWeeklyGoals] = useState<Tables<'weekly_goals'> | null>(null);

  const getMonday = () => {
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7));
    return monday.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from('weekly_goals')
      .select('*')
      .eq('client_id', user.id)
      .eq('week_start', getMonday())
      .single()
      .then(({ data }) => setWeeklyGoals(data));
  }, [user]);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIndex = (new Date().getDay() + 6) % 7;

  const toggleDay = async (goalIndex: number, dayIndex: number) => {
    if (!weeklyGoals) return;
    const goals = [...(weeklyGoals.goals as unknown as WeeklyGoalItem[])];
    goals[goalIndex] = {
      ...goals[goalIndex],
      checked_days: goals[goalIndex].checked_days.map((v, i) => i === dayIndex ? !v : v),
    };

    const { error } = await supabase
      .from('weekly_goals')
      .update({ goals: goals as any })
      .eq('id', weeklyGoals.id);

    if (error) {
      toast({ title: 'Error saving', variant: 'destructive' });
    } else {
      setWeeklyGoals({ ...weeklyGoals, goals: goals as any });
    }
  };

  const goalItems = weeklyGoals ? (weeklyGoals.goals as unknown as WeeklyGoalItem[]) : [];

  return (
    <ClientLayout>
      <h1 className="text-xl font-bold mb-4">Weekly Goals</h1>

      {goalItems.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No goals for this week yet. Your dietitian will assign them soon.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {goalItems.map((goal, gi) => (
            <Card key={gi}>
              <CardContent className="pt-4">
                <p className="font-medium mb-3">{goal.text}</p>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((day, di) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(gi, di)}
                      className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                        goal.checked_days[di]
                          ? 'bg-primary text-primary-foreground'
                          : di === todayIndex
                            ? 'bg-accent ring-1 ring-primary'
                            : 'bg-muted'
                      }`}
                    >
                      <span className="text-xs font-medium">{day}</span>
                      <Checkbox checked={goal.checked_days[di]} className="pointer-events-none" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ClientLayout>
  );
};

export default ClientGoals;
