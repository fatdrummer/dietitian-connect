import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/components/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tables } from '@/integrations/supabase/types';
import type { WeeklyGoalItem } from '@/types';

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const [currentGoals, setCurrentGoals] = useState<Tables<'weekly_goals'> | null>(null);
  const [recentComments, setRecentComments] = useState<Tables<'meal_comments'>[]>([]);
  const [recentReplies, setRecentReplies] = useState<Tables<'reflection_replies'>[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Current week goals
      const today = new Date();
      const day = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((day + 6) % 7));
      const weekStart = monday.toISOString().split('T')[0];

      const { data: goals } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('client_id', user.id)
        .eq('week_start', weekStart)
        .single();

      setCurrentGoals(goals);

      // Recent feedback
      const { data: myMeals } = await supabase.from('meals').select('id').eq('client_id', user.id);
      const mealIds = (myMeals ?? []).map((m) => m.id);
      if (mealIds.length > 0) {
        const { data: comments } = await supabase
          .from('meal_comments')
          .select('*')
          .in('meal_id', mealIds)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentComments(comments ?? []);
      }

      const { data: myReflections } = await supabase.from('reflections').select('id').eq('client_id', user.id);
      const refIds = (myReflections ?? []).map((r) => r.id);
      if (refIds.length > 0) {
        const { data: reps } = await supabase
          .from('reflection_replies')
          .select('*')
          .in('reflection_id', refIds)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentReplies(reps ?? []);
      }
    };
    fetch();
  }, [user]);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const goalItems = currentGoals ? (currentGoals.goals as unknown as WeeklyGoalItem[]) : [];
  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <ClientLayout>
      <h1 className="text-xl font-bold mb-1">Welcome, {profile?.first_name}</h1>
      <p className="text-sm text-muted-foreground mb-4">Here's your overview for the week.</p>

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">This Week's Goals</CardTitle></CardHeader>
        <CardContent>
          {goalItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No goals assigned for this week yet.</p>
          ) : goalItems.map((g, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm flex-1">{g.text}</span>
              <div className="flex gap-1">
                {DAYS.map((d, di) => (
                  <span key={d} className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs ${
                    g.checked_days[di]
                      ? 'bg-primary text-primary-foreground'
                      : di === todayIndex
                        ? 'bg-accent text-accent-foreground ring-1 ring-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}>{d[0]}</span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {(recentComments.length > 0 || recentReplies.length > 0) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Feedback</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentComments.map((c) => (
              <div key={c.id} className="text-sm bg-muted rounded p-2">
                <span className="text-muted-foreground text-xs">Meal feedback:</span> {c.content}
              </div>
            ))}
            {recentReplies.map((r) => (
              <div key={r.id} className="text-sm bg-muted rounded p-2">
                <span className="text-muted-foreground text-xs">Reflection reply:</span> {r.content}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </ClientLayout>
  );
};

export default ClientDashboard;
