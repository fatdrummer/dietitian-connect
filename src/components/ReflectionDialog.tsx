import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface ReflectionDialogProps {
  open: boolean;
  onClose: () => void;
}

const ratingLabel = (v: number) => ['', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'][v];

const ReflectionDialog = ({ open, onClose }: ReflectionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hunger, setHunger] = useState(3);
  const [cravings, setCravings] = useState(3);
  const [satisfaction, setSatisfaction] = useState(3);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setHunger(3);
      setCravings(3);
      setSatisfaction(3);
      setNotes('');
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>How Are You Feeling?</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
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
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How are you feeling about the meal plan?" rows={3} />
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting ? 'Submitting…' : 'Submit Reflection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReflectionDialog;
