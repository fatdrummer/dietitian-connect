import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DietitianLayout from '@/components/DietitianLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check } from 'lucide-react';

const SUGGESTED_TAGS = ['Weight Loss', 'Athlete', 'Vegan', 'Diabetes', 'PCOS', 'High Priority', 'Needs Follow-up'];

const NewClient = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', date_of_birth: '', sex: '',
    height_cm: '', weight_kg: '', goal: '', start_date: '', notes: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setCustomTag('');
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-client', {
        body: {
          ...form,
          height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
          weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
          date_of_birth: form.date_of_birth || null,
          start_date: form.start_date || null,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Save tags
      if (tags.length > 0 && data.client_id) {
        for (const tagName of tags) {
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .eq('created_by', user.id)
            .single();

          let tagId = existingTag?.id;
          if (!tagId) {
            const { data: newTag } = await supabase
              .from('tags')
              .insert({ name: tagName, created_by: user.id })
              .select('id')
              .single();
            tagId = newTag?.id;
          }

          if (tagId) {
            await supabase.from('client_tags').insert({ client_id: data.client_id, tag_id: tagId });
          }
        }
      }

      setCredentials({ email: form.email, password: data.temporary_password });
      setShowCredentials(true);
    } catch (err: any) {
      toast({ title: 'Error creating client', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${credentials.email}\nTemporary Password: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DietitianLayout>
      <h1 className="mb-6 text-2xl font-bold">New Client</h1>

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sex</Label>
                <Select value={form.sex} onValueChange={(v) => update('sex', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" value={form.height_cm} onChange={(e) => update('height_cm', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" value={form.weight_kg} onChange={(e) => update('weight_kg', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Goal</Label>
              <Input value={form.goal} onChange={(e) => update('goal', e.target.value)} placeholder="e.g., Lose 5kg in 3 months" />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                  <Badge key={t} variant="outline" className="cursor-pointer" onClick={() => addTag(t)}>{t}</Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Custom tag…"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(customTag))}
                />
                <Button type="button" variant="outline" onClick={() => addTag(customTag)}>Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((t) => (
                    <Badge key={t} className="cursor-pointer" onClick={() => removeTag(t)}>
                      {t} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create Client'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showCredentials} onOpenChange={(open) => { if (!open) navigate('/dietitian/clients'); setShowCredentials(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client Created Successfully</DialogTitle>
            <DialogDescription>Share these credentials with your client. The password is temporary — they will be asked to change it on first login.</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1">
            <p><span className="text-muted-foreground">Email:</span> {credentials.email}</p>
            <p><span className="text-muted-foreground">Password:</span> {credentials.password}</p>
          </div>
          <Button onClick={copyCredentials} variant="outline" className="w-full">
            {copied ? <><Check className="mr-1.5 h-4 w-4" />Copied!</> : <><Copy className="mr-1.5 h-4 w-4" />Copy Credentials</>}
          </Button>
        </DialogContent>
      </Dialog>
    </DietitianLayout>
  );
};

export default NewClient;
