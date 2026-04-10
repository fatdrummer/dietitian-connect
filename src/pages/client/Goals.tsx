import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/components/ClientLayout';
import MealUploadFlow from '@/components/MealUploadFlow';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import type { WeeklyGoalItem } from '@/types';
import { DAY_LABELS } from '@/types';

const ClientGoals = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [weeklyGoals, setWeeklyGoals] = useState<Tables<'weekly_goals'> | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Find the active goal period and compute which 7-day chunk we're in
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('weekly_goals')
      .select('*')
      .eq('client_id', user.id)
      .lte('start_date', today)
      .or(`end_date.gte.${today},end_date.is.null`)
      .order('start_date', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => setWeeklyGoals(data));
  }, [user]);

  // Compute which 7-day period index we're in
  const getCurrentPeriodStart = (): string => {
    if (!weeklyGoals) return new Date().toISOString().split('T')[0];
    const start = new Date(weeklyGoals.start_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const periodIndex = Math.floor(diffDays / 7);
    const periodStart = new Date(start);
    periodStart.setDate(start.getDate() + periodIndex * 7);
    return periodStart.toISOString().split('T')[0];
  };

  const periodStart = getCurrentPeriodStart();

  // Day index within the current 7-day period (0-6)
  const getTodayIndex = (): number => {
    const ps = new Date(periodStart + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - ps.getTime()) / (1000 * 60 * 60 * 24));
  };

  const todayIndex = getTodayIndex();

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
      <h1 className="text-xl font-bold mb-1">Welcome, {profile?.first_name}</h1>
      <p className="text-sm text-muted-foreground mb-4">Track your goals for this week.</p>

      {goalItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No goals for this period yet. Your dietitian will assign them soon.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {goalItems.map((goal, gi) => {
            const checkedCount = goal.checked_days.filter(Boolean).length;
            const pct = Math.round((checkedCount / 7) * 100);
            return (
              <Card key={gi}>
                <CardContent className="pt-4">
                  <p className="font-medium mb-3">{goal.text}</p>
                  <div className="grid grid-cols-7 gap-2">
                    {DAY_LABELS.map((day, di) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(gi, di)}
                        className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                          goal.checked_days[di]
                            ? 'bg-green-500 text-white'
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
                  <p className="mt-2 text-sm text-muted-foreground">
                    Total for week: <span className="font-semibold text-foreground">{checkedCount}/7</span>{' '}
                    <span className={`font-semibold ${pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                      ({pct}%)
                    </span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* FAB for meal upload */}
      <Button
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg md:bottom-8"
        onClick={() => setShowUpload(true)}
      >
        <Camera className="h-6 w-6" />
      </Button>

      <MealUploadFlow open={showUpload} onClose={() => setShowUpload(false)} periodStart={periodStart} />
    </ClientLayout>
  );
};

export default ClientGoals;
