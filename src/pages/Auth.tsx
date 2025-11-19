import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/logo.png";
const passwordSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres").regex(/[A-Z]/, "Debe contener al menos una letra mayúscula").regex(/[a-z]/, "Debe contener al menos una letra minúscula").regex(/[0-9]/, "Debe contener al menos un número").regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial");
const getAuthErrorMessage = (error: any): string => {
  if (error.message?.includes("Invalid login credentials")) {
    return "Email o contraseña incorrectos";
  }
  if (error.message?.includes("already registered")) {
    return "Este correo ya está registrado. Intente iniciar sesión.";
  }
  if (error.message?.includes("Email not confirmed")) {
    return "Por favor confirme su email antes de iniciar sesión";
  }
  if (error.status === 429) {
    return "Demasiados intentos. Por favor espere unos minutos.";
  }
  return "Error al procesar su solicitud. Intente nuevamente.";
};
const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Por favor complete todos los campos");
      return;
    }
    setIsLoading(true);
    const {
      error
    } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword
    });
    setIsLoading(false);
    if (error) {
      toast.error(getAuthErrorMessage(error));
    } else {
      toast.success("¡Inicio de sesión exitoso!");
    }
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupFullName) {
      toast.error("Por favor complete todos los campos");
      return;
    }
    const passwordValidation = passwordSchema.safeParse(signupPassword);
    if (!passwordValidation.success) {
      toast.error(passwordValidation.error.errors[0].message);
      return;
    }
    setIsLoading(true);
    const {
      error
    } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: {
          full_name: signupFullName
        },
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });
    setIsLoading(false);
    if (error) {
      toast.error(getAuthErrorMessage(error));
    } else {
      toast.success("¡Cuenta creada exitosamente! Puede iniciar sesión.");
      setSignupEmail("");
      setSignupPassword("");
      setSignupFullName("");
    }
  };
  return <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white">
      {/* Subtle animated gradient orbs */}
      <div style={{
      animationDuration: '8s'
    }} className="absolute w-[800px] h-[800px] -top-64 -right-64 rounded-full bg-gradient-to-br from-slate-100/40 to-slate-50/20 blur-[100px] animate-pulse bg-slate-500" />
      <div style={{
      animationDelay: '2s',
      animationDuration: '10s'
    }} className="absolute w-[600px] h-[600px] -bottom-48 -left-48 bg-gradient-to-tr from-blue-50/30 to-slate-50/15 blur-[80px] animate-pulse rounded-full bg-slate-600" />
      <div className="absolute w-[500px] h-[500px] top-1/2 right-1/4 rounded-full bg-gradient-to-bl from-slate-50/20 to-blue-50/10 blur-[60px] animate-pulse" style={{
      animationDelay: '4s',
      animationDuration: '12s'
    }} />
      
      {/* Modern Glass Card */}
      <Card className="w-full max-w-[480px] relative z-10 glass-card border-none shadow-[0_8px_32px_rgba(59,130,246,0.12),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]">
        <CardHeader className="text-center space-y-6 pt-10 pb-8 backdrop-blur-glass bg-white/40 rounded-t-lg border-b border-slate-200/50">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-sky-500/20 blur-xl rounded-full" />
              <img src={logo} alt="Ventanería y Mantenimientos" className="h-24 w-auto relative z-10 drop-shadow-[0_4px_20px_rgba(59,130,246,0.25)]" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-slate-900">
              Ventanería y Mantenimientos
            </CardTitle>
            <CardDescription className="text-base text-slate-700">
              Sistema Administrativo
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pb-10 px-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/50">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(59,130,246,0.3)] transition-all duration-300">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(59,130,246,0.3)] transition-all duration-300">
                Registrarse
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-5 mt-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="login-email" className="text-sm font-semibold text-slate-900">
                    Correo Electrónico
                  </Label>
                  <Input id="login-email" type="email" placeholder="tu@correo.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="h-12 rounded-xl border-slate-200/60 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-900 placeholder:text-slate-500" />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="login-password" className="text-sm font-semibold text-slate-900">
                    Contraseña
                  </Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="h-12 rounded-xl border-slate-200/60 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-900" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)] transition-all duration-300 hover:-translate-y-0.5" disabled={isLoading}>
                  {isLoading ? "Cargando..." : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-5 mt-8">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="signup-name" className="text-sm font-semibold text-slate-900">
                    Nombre Completo
                  </Label>
                  <Input id="signup-name" type="text" placeholder="Tu nombre completo" value={signupFullName} onChange={e => setSignupFullName(e.target.value)} required className="h-12 rounded-xl border-slate-200/60 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-900 placeholder:text-slate-500" />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="signup-email" className="text-sm font-semibold text-slate-900">
                    Correo Electrónico
                  </Label>
                  <Input id="signup-email" type="email" placeholder="tu@correo.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required className="h-12 rounded-xl border-slate-200/60 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-900 placeholder:text-slate-500" />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="signup-password" className="text-sm font-semibold text-slate-900">
                    Contraseña
                  </Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required className="h-12 rounded-xl border-slate-200/60 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-900" />
                  <p className="text-xs text-slate-700 leading-relaxed px-1">
                    Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo
                  </p>
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)] transition-all duration-300 hover:-translate-y-0.5" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;