import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/components/ClientLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const ClientMeals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [meals, setMeals] = useState<Tables<'meals'>[]>([]);
  const [comments, setComments] = useState<Tables<'meal_comments'>[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mealType, setMealType] = useState<string>('breakfast');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: m } = await supabase.from('meals').select('*').eq('client_id', user.id).order('created_at', { ascending: false });
      setMeals(m ?? []);
      const mealIds = (m ?? []).map((meal) => meal.id);
      if (mealIds.length > 0) {
        const { data: c } = await supabase.from('meal_comments').select('*').in('meal_id', mealIds);
        setComments(c ?? []);
      }
    };
    fetch();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const uploadMeal = async () => {
    if (!user) return;
    setUploading(true);

    let photoUrl: string | null = null;
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('meal-photos')
        .upload(path, selectedFile);

      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('meal-photos').getPublicUrl(path);
      photoUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('meals').insert({
      client_id: user.id,
      meal_type: mealType as any,
      notes: notes || null,
      photo_url: photoUrl,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Meal uploaded!' });
      setSelectedFile(null);
      setPreview(null);
      setNotes('');
      const { data: m } = await supabase.from('meals').select('*').eq('client_id', user.id).order('created_at', { ascending: false });
      setMeals(m ?? []);
    }
    setUploading(false);
  };

  return (
    <ClientLayout>
      <h1 className="text-xl font-bold mb-4">Meals</h1>

      <Card className="mb-6">
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label>Meal Type</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="h-48 w-full rounded-lg object-cover" />
              <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={() => { setSelectedFile(null); setPreview(null); }}>
                Remove
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full h-32 border-dashed" onClick={() => fileRef.current?.click()}>
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tap to take or select photo</span>
              </div>
            </Button>
          )}

          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes about the meal (optional)" rows={2} />

          <Button onClick={uploadMeal} disabled={uploading} className="w-full">
            <Upload className="mr-1.5 h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload Meal'}
          </Button>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mb-3">Past Meals</h2>
      {meals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No meals yet.</p>
      ) : meals.map((meal) => (
        <Card key={meal.id} className="mb-3">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {meal.photo_url && <img src={meal.photo_url} alt="Meal" className="h-16 w-16 rounded-md object-cover" />}
              <div className="flex-1">
                <Badge variant="secondary" className="capitalize">{meal.meal_type}</Badge>
                <p className="mt-1 text-sm">{meal.notes ?? ''}</p>
                <p className="text-xs text-muted-foreground">{new Date(meal.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            {comments.filter((c) => c.meal_id === meal.id).map((c) => (
              <div key={c.id} className="mt-2 text-sm bg-accent rounded p-2">
                <span className="text-xs text-muted-foreground">Dietitian:</span> {c.content}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </ClientLayout>
  );
};

export default ClientMeals;
