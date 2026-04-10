import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Stethoscope, User } from 'lucide-react';

type LoginMode = 'choose' | 'dietitian' | 'client';

const Login = () => {
  const [mode, setMode] = useState<LoginMode>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single();

    setLoading(false);

    if (roleData?.role === 'dietitian') {
      navigate('/dietitian');
    } else {
      navigate('/client');
    }
  };

  if (mode === 'choose') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">NutriTrack</CardTitle>
            <CardDescription>Choose how to sign in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-20 flex items-center gap-4 text-left justify-start px-6"
              onClick={() => setMode('dietitian')}
            >
              <Stethoscope className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-semibold">I'm a Dietitian</p>
                <p className="text-xs text-muted-foreground">Manage clients, review meals & reflections</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full h-20 flex items-center gap-4 text-left justify-start px-6"
              onClick={() => setMode('client')}
            >
              <User className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-semibold">I'm a Client</p>
                <p className="text-xs text-muted-foreground">Track goals, upload meals & reflections</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">NutriTrack</CardTitle>
          <CardDescription>
            Sign in as {mode === 'dietitian' ? 'Dietitian' : 'Client'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => { setMode('choose'); setEmail(''); setPassword(''); }}
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              ← Back to role selection
            </button>
            {mode === 'dietitian' && (
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary underline-offset-4 hover:underline">
                  Sign up
                </Link>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
