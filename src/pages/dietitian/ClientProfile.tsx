import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DietitianLayout from '@/components/DietitianLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import type { WeeklyGoalItem } from '@/types';

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
  const [newGoalWeek, setNewGoalWeek] = useState('');
  const [newGoalTexts, setNewGoalTexts] = useState('');
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Tables<'meal_comments'>[]>([]);
  const [replies, setReplies] = useState<Tables<'reflection_replies'>[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      const [profileRes, tagsRes, clientTagsRes, mealsRes, reflectionsRes, goalsRes, commentsRes, repliesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('tags').select('*'),
        supabase.from('client_tags').select('*').eq('client_id', id),
        supabase.from('meals').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('reflections').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('weekly_goals').select('*').eq('client_id', id).order('week_start', { ascending: false }),
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
    if (!id || !newGoalWeek || !newGoalTexts.trim()) return;
    const goalItems: WeeklyGoalItem[] = newGoalTexts.split('\n').filter(Boolean).map((text) => ({
      text: text.trim(),
      checked_days: [false, false, false, false, false, false, false],
    }));

    const { error } = await supabase.from('weekly_goals').insert({
      client_id: id,
      week_start: newGoalWeek,
      goals: goalItems as any,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Goals assigned' });
      setNewGoalWeek('');
      setNewGoalTexts('');
      const { data } = await supabase.from('weekly_goals').select('*').eq('client_id', id).order('week_start', { ascending: false });
      setGoals(data ?? []);
    }
  };

  const addComment = async (mealId: string) => {
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

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <DietitianLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{profile.full_name}</h1>
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
              <div><span className="text-sm text-muted-foreground">Phone:</span> <span>{profile.phone ?? '—'}</span></div>
              <div><span className="text-sm text-muted-foreground">DOB:</span> <span>{profile.date_of_birth ?? '—'}</span></div>
              <div><span className="text-sm text-muted-foreground">Sex:</span> <span>{profile.sex ?? '—'}</span></div>
              <div><span className="text-sm text-muted-foreground">Height:</span> <span>{profile.height_cm ? `${profile.height_cm} cm` : '—'}</span></div>
              <div><span className="text-sm text-muted-foreground">Weight:</span> <span>{profile.weight_kg ? `${profile.weight_kg} kg` : '—'}</span></div>
              <div><span className="text-sm text-muted-foreground">Goal:</span> <span>{profile.goal ?? '—'}</span></div>
              <div><span className="text-sm text-muted-foreground">Start Date:</span> <span>{profile.start_date ?? '—'}</span></div>
              <div className="sm:col-span-2"><span className="text-sm text-muted-foreground">Notes:</span> <span>{profile.notes ?? '—'}</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-base">Assign Weekly Goals</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input type="date" value={newGoalWeek} onChange={(e) => setNewGoalWeek(e.target.value)} placeholder="Week start (Monday)" />
              <Textarea value={newGoalTexts} onChange={(e) => setNewGoalTexts(e.target.value)} placeholder="One goal per line" rows={4} />
              <Button onClick={addGoals} disabled={!newGoalWeek || !newGoalTexts.trim()}>Assign Goals</Button>
            </CardContent>
          </Card>
          {goals.map((wg) => (
            <Card key={wg.id} className="mb-3">
              <CardContent className="pt-4">
                <p className="font-medium mb-2">Week of {wg.week_start}</p>
                {(wg.goals as unknown as WeeklyGoalItem[]).map((g, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="flex-1 text-sm">{g.text}</span>
                    <div className="flex gap-1">
                      {DAYS.map((d, di) => (
                        <span key={d} className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs ${g.checked_days[di] ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {d[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="meals">
          {meals.length === 0 ? <p className="text-muted-foreground">No meals uploaded yet.</p> : meals.map((meal) => (
            <Card key={meal.id} className="mb-3">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  {meal.photo_url && <img src={meal.photo_url} alt="Meal" className="h-20 w-20 rounded-md object-cover" />}
                  <div className="flex-1">
                    <Badge variant="secondary" className="capitalize">{meal.meal_type}</Badge>
                    <p className="mt-1 text-sm">{meal.notes ?? 'No notes'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(meal.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2 border-t pt-3">
                  {comments.filter((c) => c.meal_id === meal.id).map((c) => (
                    <p key={c.id} className="text-sm bg-muted rounded p-2">{c.content}</p>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add comment…"
                      value={commentText[meal.id] ?? ''}
                      onChange={(e) => setCommentText((prev) => ({ ...prev, [meal.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addComment(meal.id)}
                    />
                    <Button size="sm" onClick={() => addComment(meal.id)}>Send</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
