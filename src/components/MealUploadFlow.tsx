import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Camera, ArrowLeft } from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';
import { MEAL_TYPES, DAY_LABELS } from '@/types';
import type { MealType } from '@/types';

interface MealUploadFlowProps {
  open: boolean;
  onClose: () => void;
  periodStart: string;
  dateRange?: { start: string; end?: string };
}

type Step = 'day' | 'type' | 'photo' | 'confirm';

const MealUploadFlow = ({ open, onClose, periodStart, dateRange }: MealUploadFlowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('day');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<MealType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('day');
      setSelectedDay(null);
      setSelectedType(null);
      setSelectedFile(null);
      setPreview(null);
      setNotes('');
    }
  }, [open]);

  const getDayDates = () => {
    const start = new Date(periodStart + 'T00:00:00');
    return DAY_LABELS.map((label, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      // Check if this date is within the allowed range
      let enabled = true;
      if (dateRange) {
        if (dateStr < dateRange.start) enabled = false;
        if (dateRange.end && dateStr > dateRange.end) enabled = false;
      }
      return { label, date: dateStr, dayObj: d, enabled };
    });
  };

  const handleDaySelect = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setStep('type');
  };

  const handleTypeSelect = (type: MealType) => {
    setSelectedType(type);
    setStep('photo');
    setTimeout(() => fileRef.current?.click(), 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setStep('confirm');
    }
  };

  const handleSubmit = async () => {
    if (!user || selectedDay === null || !selectedType) return;
    setUploading(true);

    const days = getDayDates();
    const mealDate = days[selectedDay].date;

    let photoUrl: string | null = null;
    if (selectedFile) {
      const compressed = await compressImage(selectedFile);
      const path = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('meal-photos').upload(path, selectedFile);
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
      meal_type: selectedType as any,
      meal_date: mealDate,
      notes: notes || null,
      photo_url: photoUrl,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Meal uploaded!' });
      onClose();
    }
    setUploading(false);
  };

  const goBack = () => {
    if (step === 'type') setStep('day');
    else if (step === 'photo') setStep('type');
    else if (step === 'confirm') setStep('photo');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== 'day' && (
              <button onClick={goBack} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {step === 'day' && 'Pick a day'}
            {step === 'type' && 'Pick meal type'}
            {step === 'photo' && 'Take a photo'}
            {step === 'confirm' && 'Add details'}
          </DialogTitle>
        </DialogHeader>

        {step === 'day' && (
          <div className="grid grid-cols-1 gap-2">
            {getDayDates().map((day, i) => (
              <Button
                key={i}
                variant="outline"
                className="justify-start h-12"
                onClick={() => handleDaySelect(i)}
                disabled={!day.enabled}
              >
                <span className="font-medium w-12">{day.label}</span>
                <span className="text-muted-foreground text-sm">{day.date}</span>
              </Button>
            ))}
          </div>
        )}

        {step === 'type' && (
          <div className="grid grid-cols-2 gap-2">
            {MEAL_TYPES.map((mt) => (
              <Button key={mt.value} variant="outline" className="h-14" onClick={() => handleTypeSelect(mt.value)}>
                {mt.label}
              </Button>
            ))}
          </div>
        )}

        {step === 'photo' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            <Button variant="outline" className="h-32 w-full border-dashed" onClick={() => fileRef.current?.click()}>
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-10 w-10 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tap to take or select photo</span>
              </div>
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            {preview && <img src={preview} alt="Meal preview" className="h-48 w-full rounded-lg object-cover" />}
            <div className="text-sm text-muted-foreground">
              {selectedDay !== null && getDayDates()[selectedDay].label} · {MEAL_TYPES.find(m => m.value === selectedType)?.label}
            </div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Comments about the meal (optional)" rows={3} />
            <Button onClick={handleSubmit} disabled={uploading} className="w-full">
              {uploading ? 'Uploading…' : 'Upload Meal'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MealUploadFlow;
