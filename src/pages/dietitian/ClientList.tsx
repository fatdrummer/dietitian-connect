import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DietitianLayout from '@/components/DietitianLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type ProfileRow = Tables<'profiles'>;
type TagRow = Tables<'tags'>;

interface ClientWithTags extends ProfileRow {
  tags: TagRow[];
}

const ClientList = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientWithTags[]>([]);
  const [search, setSearch] = useState('');
  const [allTags, setAllTags] = useState<TagRow[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('dietitian_id', user.id);

      const { data: tags } = await supabase.from('tags').select('*');
      const { data: clientTags } = await supabase.from('client_tags').select('*');

      setAllTags(tags ?? []);

      const enriched: ClientWithTags[] = (profiles ?? []).map((p) => {
        const tagIds = (clientTags ?? []).filter((ct) => ct.client_id === p.id).map((ct) => ct.tag_id);
        return { ...p, tags: (tags ?? []).filter((t) => tagIds.includes(t.id)) };
      });

      setClients(enriched);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = clients.filter((c) => {
    const matchesSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.goal ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesTags = selectedTags.length === 0 || c.tags.some((t) => selectedTags.includes(t.id));
    return matchesSearch && matchesTags;
  });

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  return (
    <DietitianLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button asChild>
          <Link to="/dietitian/clients/new"><Plus className="mr-1.5 h-4 w-4" />New Client</Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No clients found</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <Link key={client.id} to={`/dietitian/clients/${client.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{client.full_name}</p>
                      <p className="text-sm text-muted-foreground">{client.goal ?? 'No goal set'}</p>
                    </div>
                  </div>
                  {client.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {client.tags.map((t) => (
                        <Badge key={t.id} variant="secondary" className="text-xs">{t.name}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DietitianLayout>
  );
};

export default ClientList;
