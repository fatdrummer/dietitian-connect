import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DietitianLayout from '@/components/DietitianLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Tables } from '@/integrations/supabase/types';

const MealReview = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<(Tables<'meals'> & { client_name: string })[]>([]);
  const [comments, setComments] = useState<Tables<'meal_comments'>[]>([]);
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: clients } = await supabase.from('profiles').select('id, full_name').eq('dietitian_id', user.id);
      const { data: allMeals } = await supabase.from('meals').select('*').order('created_at', { ascending: false });
      const { data: allComments } = await supabase.from('meal_comments').select('*');

      const clientMap = new Map((clients ?? []).map((c) => [c.id, c.full_name]));
      const enriched = (allMeals ?? [])
        .filter((m) => clientMap.has(m.client_id))
        .map((m) => ({ ...m, client_name: clientMap.get(m.client_id) ?? 'Unknown' }));

      setMeals(enriched);
      setComments(allComments ?? []);
    };
    fetch();
  }, [user]);

  const addComment = async (mealId: string) => {
    if (!user || !commentText[mealId]?.trim()) return;
    await supabase.from('meal_comments').insert({ meal_id: mealId, author_id: user.id, content: commentText[mealId] });
    setCommentText((prev) => ({ ...prev, [mealId]: '' }));
    const { data } = await supabase.from('meal_comments').select('*');
    setComments(data ?? []);
  };

  return (
    <DietitianLayout>
      <h1 className="mb-6 text-2xl font-bold">Meal Reviews</h1>
      {meals.length === 0 ? (
        <p className="text-muted-foreground">No meal uploads yet.</p>
      ) : meals.map((meal) => (
        <Card key={meal.id} className="mb-3">
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              {meal.photo_url && <img src={meal.photo_url} alt="Meal" className="h-24 w-24 rounded-md object-cover" />}
              <div className="flex-1">
                <p className="font-medium">{meal.client_name}</p>
                <Badge variant="secondary" className="capitalize mt-1">{meal.meal_type}</Badge>
                <p className="mt-1 text-sm">{meal.notes ?? ''}</p>
                <p className="text-xs text-muted-foreground">{new Date(meal.created_at).toLocaleDateString()}</p>
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
    </DietitianLayout>
  );
};

export default MealReview;
