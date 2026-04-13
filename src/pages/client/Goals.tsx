import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/components/ClientLayout';
import MealUploadFlow from '@/components/MealUploadFlow';
import ReflectionDialog from '@/components/ReflectionDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Camera, CalendarClock, Trophy, MessageSquare, ChevronDown } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import type { WeeklyGoalItem } from '@/types';

const ClientGoals = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [weeklyGoals, setWeeklyGoals] = useState<Tables<'weekly_goals'> | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

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

  const goalItems = weeklyGoals ? (weeklyGoals.goals as unknown as WeeklyGoalItem[]) : [];

  // Calculate total days
  const getTotalDays = (): number => {
    if (!weeklyGoals?.end_date) return 7;
    const start = new Date(weeklyGoals.start_date + 'T00:00:00');
    const end = new Date(weeklyGoals.end_date + 'T00:00:00');
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const totalDays = getTotalDays();
  const numBlocks = Math.ceil(totalDays / 7);

  // Get the current block index based on today's date
  const getCurrentBlockIndex = (): number => {
    if (!weeklyGoals) return 0;
    const start = new Date(weeklyGoals.start_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.floor(diffDays / 7), numBlocks - 1);
  };

  const currentBlockIndex = getCurrentBlockIndex();

  // Get today's absolute day index for highlighting
  const getTodayAbsIndex = (): number => {
    if (!weeklyGoals) return 0;
    const start = new Date(weeklyGoals.start_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const todayAbsIndex = getTodayAbsIndex();

  // Get date label for an absolute day index
  const getDayLabel = (absIndex: number): string => {
    if (!weeklyGoals) return '';
    const d = new Date(weeklyGoals.start_date + 'T00:00:00');
    d.setDate(d.getDate() + absIndex);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
  };

  // Compute block info
  const getBlockDays = (blockIndex: number): number[] => {
    const startIdx = blockIndex * 7;
    const endIdx = Math.min(startIdx + 7, totalDays);
    return Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i);
  };

  // Overall stats
  const totalChecked = goalItems.reduce((sum, g) => sum + g.checked_days.filter(Boolean).length, 0);
  const totalPossible = goalItems.length * totalDays;
  const overallPct = totalPossible > 0 ? Math.round((totalChecked / totalPossible) * 100) : 0;

  const mealDateRange = weeklyGoals
    ? { start: weeklyGoals.start_date, end: weeklyGoals.end_date ?? undefined }
    : undefined;

  const periodStart = weeklyGoals?.start_date ?? new Date().toISOString().split('T')[0];

  const toggleDay = async (goalIndex: number, absDay: number) => {
    if (!weeklyGoals) return;
    const goals = [...(weeklyGoals.goals as unknown as WeeklyGoalItem[])];
    const checkedDays = [...goals[goalIndex].checked_days];
    // Ensure array is long enough
    while (checkedDays.length <= absDay) checkedDays.push(false);
    checkedDays[absDay] = !checkedDays[absDay];
    goals[goalIndex] = { ...goals[goalIndex], checked_days: checkedDays };

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

  return (
    <ClientLayout>
      <h1 className="text-xl font-bold mb-1">Welcome, {profile?.first_name}</h1>
      <p className="text-sm text-muted-foreground mb-4">Track your goals for this period.</p>

      {/* Next Appointment Date */}
      {weeklyGoals?.end_date && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="py-3 flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Next Appointment</p>
              <p className="text-lg font-bold text-primary">{weeklyGoals.end_date}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall progress */}
      {goalItems.length > 0 && (
        <Card className="mb-4">
          <CardContent className="py-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-bold">{overallPct}%</span>
            </div>
            <Progress value={overallPct} className="h-3" />
            <p className="text-xs text-muted-foreground mt-1">{totalChecked} / {totalPossible} days checked</p>
          </CardContent>
        </Card>
      )}

      {/* Goal accomplished message */}
      {goalItems.length > 0 && overallPct > 80 && (
        <Card className="mb-4 border-green-500/30 bg-green-500/10">
          <CardContent className="py-3 flex items-center gap-3">
            <Trophy className="h-6 w-6 text-green-600" />
            <p className="font-bold text-green-700">Goal Accomplished! Good Job! 🎉</p>
          </CardContent>
        </Card>
      )}

      {goalItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No goals for this period yet. Your dietitian will assign them soon.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {goalItems.map((goal, gi) => {
            const allChecked = goal.checked_days.filter(Boolean).length;
            const allPct = totalDays > 0 ? Math.round((allChecked / totalDays) * 100) : 0;

            return (
              <Card key={gi}>
                <CardContent className="pt-4">
                  <p className="font-medium mb-1">{goal.text}</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Overall: <span className="font-semibold text-foreground">{allChecked}/{totalDays}</span>{' '}
                    <span className={`font-semibold ${allPct >= 70 ? 'text-green-600' : allPct >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                      ({allPct}%)
                    </span>
                  </p>

                  {Array.from({ length: numBlocks }).map((_, bi) => {
                    const days = getBlockDays(bi);
                    const blockChecked = days.filter(d => goal.checked_days[d]).length;
                    const blockPct = Math.round((blockChecked / days.length) * 100);
                    const isCurrentBlock = bi === currentBlockIndex;

                    return (
                      <Collapsible key={bi} defaultOpen={isCurrentBlock}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm hover:bg-accent rounded px-2 -mx-2">
                          <span className={`font-medium ${isCurrentBlock ? 'text-primary' : ''}`}>
                            Week {bi + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${blockPct >= 70 ? 'text-green-600' : blockPct >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                              {blockChecked}/{days.length} ({blockPct}%)
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="grid grid-cols-7 gap-1 py-2">
                            {days.map((absIdx) => (
                              <button
                                key={absIdx}
                                onClick={() => toggleDay(gi, absIdx)}
                                className={`flex flex-col items-center gap-1 rounded-lg p-1.5 transition-colors text-xs ${
                                  goal.checked_days[absIdx]
                                    ? 'bg-green-500 text-white'
                                    : absIdx === todayAbsIndex
                                      ? 'bg-accent ring-1 ring-primary'
                                      : 'bg-muted'
                                }`}
                              >
                                <span className="font-medium truncate w-full text-center">{getDayLabel(absIdx)}</span>
                                <Checkbox checked={!!goal.checked_days[absIdx]} className="pointer-events-none" />
                              </button>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* FABs */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 md:bottom-8">
        <Button
          className="h-12 w-12 rounded-full shadow-lg"
          variant="outline"
          onClick={() => setShowReflection(true)}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Button
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setShowUpload(true)}
        >
          <Camera className="h-6 w-6" />
        </Button>
      </div>

      <MealUploadFlow
        open={showUpload}
        onClose={() => setShowUpload(false)}
        periodStart={periodStart}
        dateRange={mealDateRange}
      />

      <ReflectionDialog
        open={showReflection}
        onClose={() => setShowReflection(false)}
      />
    </ClientLayout>
  );
};

export default ClientGoals;
