import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DAY_LABELS, MEAL_TYPES } from '@/types';
import type { Tables } from '@/integrations/supabase/types';

interface MealGridProps {
  meals: Tables<'meals'>[];
  comments?: Tables<'meal_comments'>[];
  periodStart: string; // ISO date
}

const MealGrid = ({ meals, comments = [], periodStart }: MealGridProps) => {
  const [selectedMeal, setSelectedMeal] = useState<Tables<'meals'> | null>(null);

  const getDayDates = () => {
    const start = new Date(periodStart + 'T00:00:00');
    return DAY_LABELS.map((label, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { label, date: d.toISOString().split('T')[0] };
    });
  };

  const days = getDayDates();

  const getMeal = (date: string, mealType: string) => {
    return meals.find((m) => m.meal_date === date && m.meal_type === mealType);
  };

  const mealComments = selectedMeal
    ? comments.filter((c) => c.meal_id === selectedMeal.id)
    : [];

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-muted-foreground font-medium border-b">Day</th>
              {MEAL_TYPES.map((mt) => (
                <th key={mt.value} className="p-2 text-center text-muted-foreground font-medium border-b whitespace-nowrap">
                  {mt.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date} className="border-b last:border-0">
                <td className="p-2 font-medium whitespace-nowrap">
                  <div>{day.label}</div>
                  <div className="text-xs text-muted-foreground">{day.date}</div>
                </td>
                {MEAL_TYPES.map((mt) => {
                  const meal = getMeal(day.date, mt.value);
                  return (
                    <td key={mt.value} className="p-1 text-center">
                      {meal ? (
                        <button
                          onClick={() => setSelectedMeal(meal)}
                          className="inline-block rounded-md overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                        >
                          {meal.photo_url ? (
                            <img src={meal.photo_url} alt="Meal" className="h-12 w-12 object-cover rounded-md" />
                          ) : (
                            <div className="h-12 w-12 bg-primary/20 rounded-md flex items-center justify-center text-xs text-primary">✓</div>
                          )}
                        </button>
                      ) : (
                        <div className="h-12 w-12 mx-auto rounded-md bg-muted/50" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedMeal} onOpenChange={(o) => !o && setSelectedMeal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selectedMeal && MEAL_TYPES.find(m => m.value === selectedMeal.meal_type)?.label} — {selectedMeal?.meal_date}
            </DialogTitle>
          </DialogHeader>
          {selectedMeal?.photo_url && (
            <img src={selectedMeal.photo_url} alt="Meal" className="w-full rounded-lg object-cover max-h-64" />
          )}
          {selectedMeal?.notes && <p className="text-sm">{selectedMeal.notes}</p>}
          {mealComments.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs text-muted-foreground font-medium">Comments</p>
              {mealComments.map((c) => (
                <div key={c.id} className="text-sm bg-accent rounded p-2">{c.content}</div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MealGrid;
