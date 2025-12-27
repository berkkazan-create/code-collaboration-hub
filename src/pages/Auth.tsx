import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Package, TrendingUp, Users, Loader2 } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  fullName: z.string().optional(),
});

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password, fullName });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('E-posta veya şifre hatalı');
      } else {
        toast.error('Giriş yapılırken bir hata oluştu');
      }
    } else {
      toast.success('Giriş başarılı!');
      navigate('/dashboard');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Bu e-posta adresi zaten kayıtlı');
      } else {
        toast.error('Kayıt olurken bir hata oluştu');
      }
    } else {
      toast.success('Kayıt başarılı! Giriş yapabilirsiniz.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/20 p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">StokTakip</h1>
          <p className="text-muted-foreground mt-2">İşletmenizi yönetin</p>
        </div>

        {/* Features */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center mb-2">
              <Package className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Stok</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Maliyet</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Cari</span>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="glass border-border/50 shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Hoş Geldiniz</CardTitle>
            <CardDescription>Hesabınıza giriş yapın veya yeni hesap oluşturun</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Giriş Yap</TabsTrigger>
                <TabsTrigger value="signup">Kayıt Ol</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">E-posta</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Şifre</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Giriş Yap
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Ad Soyad</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Adınız Soyadınız"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-posta</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Şifre</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kayıt Ol
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
