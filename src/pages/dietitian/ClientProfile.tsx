import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DietitianLayout from '@/components/DietitianLayout';
import MealGrid from '@/components/MealGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, ChevronLeft, ChevronRight, Trash2, Pencil, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
import type { WeeklyGoalItem } from '@/types';
import { DAY_LABELS } from '@/types';

type ProfileRow = Tables<'profiles'>;

const ClientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [tags, setTags] = useState<Tables<'tags'>[]>([]);
  const [meals, setMeals] = useState<Tables<'meals'>[]>([]);
  const [reflections, setReflections] = useState<Tables<'reflections'>[]>([]);
  const [goals, setGoals] = useState<Tables<'weekly_goals'>[]>([]);
  const [newGoalTexts, setNewGoalTexts] = useState('');
  const [newGoalEndDate, setNewGoalEndDate] = useState<Date | undefined>();
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Tables<'meal_comments'>[]>([]);
  const [replies, setReplies] = useState<Tables<'reflection_replies'>[]>([]);
  const [mealPeriodOffset, setMealPeriodOffset] = useState(0);
  const [editingGoalSet, setEditingGoalSet] = useState<string | null>(null);
  const [editGoalTexts, setEditGoalTexts] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      const [profileRes, tagsRes, clientTagsRes, mealsRes, reflectionsRes, goalsRes, commentsRes, repliesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('tags').select('*'),
        supabase.from('client_tags').select('*').eq('client_id', id),
        supabase.from('meals').select('*').eq('client_id', id).order('meal_date', { ascending: true }),
        supabase.from('reflections').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('weekly_goals').select('*').eq('client_id', id).order('start_date', { ascending: false }),
        supabase.from('meal_comments').select('*'),
        supabase.from('reflection_replies').select('*'),
      ]);

      setProfile(profileRes.data);
      const tagIds = (clientTagsRes.data ?? []).map((ct) => ct.tag_id);
      setTags((tagsRes.data ?? []).filter((t) => tagIds.includes(t.id)));
      setMeals(mealsRes.data ?? []);
      setReflections(reflectionsRes.data ?? []);
      setGoals(goalsRes.data ?? []);
      setComments(commentsRes.data ?? []);
      setReplies(repliesRes.data ?? []);
    };
    fetchAll();
  }, [id]);

  const addGoals = async () => {
    if (!id || !newGoalEndDate || !newGoalTexts.trim()) return;
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = newGoalEndDate.toISOString().split('T')[0];
    const startD = new Date(startDate + 'T00:00:00');
    const endD = new Date(endDate + 'T00:00:00');
    const totalDays = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));
    const goalItems: WeeklyGoalItem[] = newGoalTexts.split('\n').filter(Boolean).map((text) => ({
      text: text.trim(),
      checked_days: Array(totalDays).fill(false),
    }));

    const { error } = await supabase.from('weekly_goals').insert({
      client_id: id,
      start_date: startDate,
      end_date: endDate,
      goals: goalItems as any,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Goals assigned' });
      setNewGoalTexts('');
      setNewGoalEndDate(undefined);
      const { data } = await supabase.from('weekly_goals').select('*').eq('client_id', id).order('start_date', { ascending: false });
      setGoals(data ?? []);
    }
  };

  const refreshGoals = async () => {
    if (!id) return;
    const { data } = await supabase.from('weekly_goals').select('*').eq('client_id', id).order('start_date', { ascending: false });
    setGoals(data ?? []);
  };

  const deleteGoalSet = async (goalId: string) => {
    const { error } = await supabase.from('weekly_goals').delete().eq('id', goalId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Goals deleted' });
      await refreshGoals();
    }
  };

  const startEditGoalSet = (wg: Tables<'weekly_goals'>) => {
    const items = wg.goals as unknown as WeeklyGoalItem[];
    setEditingGoalSet(wg.id);
    setEditGoalTexts(items.map((g) => g.text));
  };

  const saveEditGoalSet = async (wg: Tables<'weekly_goals'>) => {
    const oldItems = wg.goals as unknown as WeeklyGoalItem[];
    const newItems = editGoalTexts
      .filter((t) => t.trim())
      .map((text, i) => ({
        text: text.trim(),
        checked_days: oldItems[i]?.checked_days ?? Array(oldItems[0]?.checked_days.length ?? 7).fill(false),
      }));

    const { error } = await supabase
      .from('weekly_goals')
      .update({ goals: newItems as any })
      .eq('id', wg.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Goals updated' });
      setEditingGoalSet(null);
      await refreshGoals();
    }
  };

  const deleteGoalItem = async (wg: Tables<'weekly_goals'>, itemIndex: number) => {
    const items = (wg.goals as unknown as WeeklyGoalItem[]).filter((_, i) => i !== itemIndex);
    if (items.length === 0) {
      await deleteGoalSet(wg.id);
      return;
    }
    const { error } = await supabase
      .from('weekly_goals')
      .update({ goals: items as any })
      .eq('id', wg.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await refreshGoals();
    }
  };


    if (!user || !commentText[mealId]?.trim()) return;
    await supabase.from('meal_comments').insert({
      meal_id: mealId, author_id: user.id, content: commentText[mealId],
    });
    setCommentText((prev) => ({ ...prev, [mealId]: '' }));
    const { data } = await supabase.from('meal_comments').select('*');
    setComments(data ?? []);
  };

  const addReply = async (reflectionId: string) => {
    if (!user || !replyText[reflectionId]?.trim()) return;
    await supabase.from('reflection_replies').insert({
      reflection_id: reflectionId, author_id: user.id, content: replyText[reflectionId],
    });
    setReplyText((prev) => ({ ...prev, [reflectionId]: '' }));
    const { data } = await supabase.from('reflection_replies').select('*');
    setReplies(data ?? []);
  };

  if (!profile) return <DietitianLayout><p>Loading…</p></DietitianLayout>;

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();

  // Meal grid period logic
  const getActivePeriodStart = () => {
    if (goals.length === 0) {
      const today = new Date();
      const day = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((day + 6) % 7) + mealPeriodOffset * 7);
      return monday.toISOString().split('T')[0];
    }
    const latestGoal = goals[0];
    const start = new Date(latestGoal.start_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const currentPeriodIndex = Math.floor(diffDays / 7);
    const targetIndex = currentPeriodIndex + mealPeriodOffset;
    const periodStart = new Date(start);
    periodStart.setDate(start.getDate() + targetIndex * 7);
    return periodStart.toISOString().split('T')[0];
  };

  const mealPeriodStart = getActivePeriodStart();
  const mealPeriodEnd = (() => {
    const ps = new Date(mealPeriodStart + 'T00:00:00');
    ps.setDate(ps.getDate() + 6);
    return ps.toISOString().split('T')[0];
  })();

  const periodMeals = meals.filter(
    (m) => m.meal_date && m.meal_date >= mealPeriodStart && m.meal_date <= mealPeriodEnd
  );

  return (
    <DietitianLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{fullName}</h1>
        {profile.soma_id && <p className="text-sm text-muted-foreground">SOMA ID: {profile.soma_id}</p>}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {tags.map((t) => <Badge key={t.id} variant="secondary">{t.name}</Badge>)}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="meals">Meals</TabsTrigger>
          <TabsTrigger value="reflections">Reflections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6 grid gap-3 sm:grid-cols-2">
              <div><span className="text-sm text-muted-foreground">Sex:</span> <span>{profile.sex ?? '—'}</span></div>
              <div><span className="text-sm text-muted-foreground">SOMA ID:</span> <span>{profile.soma_id ?? '—'}</span></div>
              <div className="sm:col-span-2"><span className="text-sm text-muted-foreground">Notes:</span> <span>{profile.notes ?? '—'}</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-base">Assign Goals</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={newGoalTexts} onChange={(e) => setNewGoalTexts(e.target.value)} placeholder="One goal per line" rows={4} />
              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newGoalEndDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newGoalEndDate ? format(newGoalEndDate, 'PPP') : 'Pick an end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newGoalEndDate}
                      onSelect={setNewGoalEndDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={addGoals} disabled={!newGoalEndDate || !newGoalTexts.trim()}>Assign Goals</Button>
            </CardContent>
          </Card>
          {goals.map((wg) => (
            <Card key={wg.id} className="mb-3">
              <CardContent className="pt-4">
                <p className="font-medium mb-1">
                  {wg.start_date} → {wg.end_date ?? 'ongoing'}
                </p>
                {(wg.goals as unknown as WeeklyGoalItem[]).map((g, i) => {
                  const checkedCount = g.checked_days.filter(Boolean).length;
                  return (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <span className="flex-1 text-sm">{g.text}</span>
                      <div className="flex gap-1">
                        {DAY_LABELS.map((d, di) => (
                          <span key={d} className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs ${g.checked_days[di] ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                            {d[0]}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{checkedCount}/7</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="meals">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setMealPeriodOffset((p) => p - 1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium">{mealPeriodStart} — {mealPeriodEnd}</span>
            <Button variant="ghost" size="icon" onClick={() => setMealPeriodOffset((p) => p + 1)} disabled={mealPeriodOffset >= 0}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              <MealGrid meals={periodMeals} comments={comments} periodStart={mealPeriodStart} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reflections">
          {reflections.length === 0 ? <p className="text-muted-foreground">No reflections yet.</p> : reflections.map((r) => (
            <Card key={r.id} className="mb-3">
              <CardContent className="pt-4">
                <div className="flex gap-4 mb-2">
                  <span className="text-sm"><span className="text-muted-foreground">Hunger:</span> {r.hunger_rating}/5</span>
                  <span className="text-sm"><span className="text-muted-foreground">Cravings:</span> {r.cravings_rating}/5</span>
                  <span className="text-sm"><span className="text-muted-foreground">Satisfaction:</span> {r.satisfaction_rating}/5</span>
                </div>
                <p className="text-sm">{r.notes ?? 'No notes'}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                <div className="mt-3 space-y-2 border-t pt-3">
                  {replies.filter((rep) => rep.reflection_id === r.id).map((rep) => (
                    <p key={rep.id} className="text-sm bg-muted rounded p-2">{rep.content}</p>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Reply…"
                      value={replyText[r.id] ?? ''}
                      onChange={(e) => setReplyText((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addReply(r.id)}
                    />
                    <Button size="sm" onClick={() => addReply(r.id)}>Send</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </DietitianLayout>
  );
};

export default ClientProfile;
