import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/components/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

const ClientReflections = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reflections, setReflections] = useState<Tables<'reflections'>[]>([]);
  const [replies, setReplies] = useState<Tables<'reflection_replies'>[]>([]);
  const [hunger, setHunger] = useState(3);
  const [cravings, setCravings] = useState(3);
  const [satisfaction, setSatisfaction] = useState(3);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: r } = await supabase.from('reflections').select('*').eq('client_id', user.id).order('created_at', { ascending: false });
      setReflections(r ?? []);
      const refIds = (r ?? []).map((ref) => ref.id);
      if (refIds.length > 0) {
        const { data: reps } = await supabase.from('reflection_replies').select('*').in('reflection_id', refIds);
        setReplies(reps ?? []);
      }
    };
    fetch();
  }, [user]);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('reflections').insert({
      client_id: user.id,
      hunger_rating: hunger,
      cravings_rating: cravings,
      satisfaction_rating: satisfaction,
      notes: notes || null,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Reflection submitted!' });
      setHunger(3); setCravings(3); setSatisfaction(3); setNotes('');
      const { data: r } = await supabase.from('reflections').select('*').eq('client_id', user.id).order('created_at', { ascending: false });
      setReflections(r ?? []);
    }
    setSubmitting(false);
  };

  const ratingLabel = (v: number) => ['', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'][v];

  return (
    <ClientLayout>
      <h1 className="text-xl font-bold mb-4">Reflections</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Share How You're Feeling</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Hunger Level</Label>
              <span className="text-sm text-muted-foreground">{ratingLabel(hunger)} ({hunger}/5)</span>
            </div>
            <Slider min={1} max={5} step={1} value={[hunger]} onValueChange={([v]) => setHunger(v)} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Cravings</Label>
              <span className="text-sm text-muted-foreground">{ratingLabel(cravings)} ({cravings}/5)</span>
            </div>
            <Slider min={1} max={5} step={1} value={[cravings]} onValueChange={([v]) => setCravings(v)} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Satisfaction</Label>
              <span className="text-sm text-muted-foreground">{ratingLabel(satisfaction)} ({satisfaction}/5)</span>
            </div>
            <Slider min={1} max={5} step={1} value={[satisfaction]} onValueChange={([v]) => setSatisfaction(v)} />
          </div>
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How are you feeling about the meal plan? Any questions?" rows={3} />
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting ? 'Submitting…' : 'Submit Reflection'}
          </Button>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mb-3">Past Reflections</h2>
      {reflections.map((r) => (
        <Card key={r.id} className="mb-3">
          <CardContent className="pt-4">
            <div className="flex gap-4 mb-1">
              <span className="text-sm">Hunger: {r.hunger_rating}/5</span>
              <span className="text-sm">Cravings: {r.cravings_rating}/5</span>
              <span className="text-sm">Satisfaction: {r.satisfaction_rating}/5</span>
            </div>
            <p className="text-sm">{r.notes ?? ''}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
            {replies.filter((rep) => rep.reflection_id === r.id).map((rep) => (
              <div key={rep.id} className="mt-2 text-sm bg-accent rounded p-2">
                <span className="text-xs text-muted-foreground">Dietitian:</span> {rep.content}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </ClientLayout>
  );
};

export default ClientReflections;
