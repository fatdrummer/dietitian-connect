import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DietitianLayout from '@/components/DietitianLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Tables } from '@/integrations/supabase/types';

const ReflectionInbox = () => {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<(Tables<'reflections'> & { client_name: string })[]>([]);
  const [replies, setReplies] = useState<Tables<'reflection_replies'>[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: clients } = await supabase.from('profiles').select('id, first_name, last_name').eq('dietitian_id', user.id);
      const { data: allReflections } = await supabase.from('reflections').select('*').order('created_at', { ascending: false });
      const { data: allReplies } = await supabase.from('reflection_replies').select('*');

      const clientMap = new Map((clients ?? []).map((c) => [c.id, `${c.first_name} ${c.last_name}`.trim()]));
      const enriched = (allReflections ?? [])
        .filter((r) => clientMap.has(r.client_id))
        .map((r) => ({ ...r, client_name: clientMap.get(r.client_id) ?? 'Unknown' }));

      setReflections(enriched);
      setReplies(allReplies ?? []);
    };
    fetch();
  }, [user]);

  const addReply = async (reflectionId: string) => {
    if (!user || !replyText[reflectionId]?.trim()) return;
    await supabase.from('reflection_replies').insert({
      reflection_id: reflectionId, author_id: user.id, content: replyText[reflectionId],
    });
    setReplyText((prev) => ({ ...prev, [reflectionId]: '' }));
    const { data } = await supabase.from('reflection_replies').select('*');
    setReplies(data ?? []);
  };

  return (
    <DietitianLayout>
      <h1 className="mb-6 text-2xl font-bold">Reflections</h1>
      {reflections.length === 0 ? (
        <p className="text-muted-foreground">No reflections yet.</p>
      ) : reflections.map((r) => (
        <Card key={r.id} className="mb-3">
          <CardContent className="pt-4">
            <p className="font-medium">{r.client_name}</p>
            <div className="flex gap-4 mt-1 mb-2">
              <span className="text-sm"><span className="text-muted-foreground">Hunger:</span> {r.hunger_rating}/5</span>
              <span className="text-sm"><span className="text-muted-foreground">Cravings:</span> {r.cravings_rating}/5</span>
              <span className="text-sm"><span className="text-muted-foreground">Satisfaction:</span> {r.satisfaction_rating}/5</span>
            </div>
            <p className="text-sm">{r.notes ?? ''}</p>
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
    </DietitianLayout>
  );
};

export default ReflectionInbox;
