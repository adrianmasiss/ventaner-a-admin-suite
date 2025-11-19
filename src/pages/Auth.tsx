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

const passwordSchema = z.string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
  .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
  .regex(/[0-9]/, "Debe contener al menos un número")
  .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial");

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
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

    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: {
          full_name: signupFullName,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute w-[600px] h-[600px] -top-48 -right-48 rounded-full bg-blue-500/15 blur-3xl animate-float" />
      <div className="absolute w-[500px] h-[500px] -bottom-36 -left-36 rounded-full bg-purple-500/12 blur-3xl animate-float" style={{ animationDelay: '2s', animationDirection: 'reverse' }} />
      
      {/* Login Glass Card */}
      <Card className="w-full max-w-md relative z-10 bg-white/85 backdrop-blur-[30px] border-white/40 shadow-[0_20px_60px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.2),0_0_80px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(0,0,0,0.05)] rounded-3xl before:content-[''] before:absolute before:inset-[-2px] before:rounded-3xl before:p-[2px] before:bg-gradient-to-br before:from-blue-500/50 before:via-purple-500/30 before:to-pink-500/20 before:-z-10 before:opacity-60">
        <CardHeader className="text-center space-y-4 pt-12">
          <div className="flex justify-center">
            <img 
              src={logo} 
              alt="Ventanería y Mantenimientos" 
              className="h-32 w-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
            />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold gradient-text-primary">
              Ventanería y Mantenimientos
            </CardTitle>
            <CardDescription className="text-base mt-2 text-slate-600/80">
              Sistema Administrativo
            </CardDescription>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        </CardHeader>
        
        <CardContent className="pb-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100/60 backdrop-blur-sm p-1">
              <TabsTrigger value="login" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-glow-blue">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-glow-blue">
                Registrarse
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-slate-700 font-medium">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="glass-input h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-slate-700 font-medium">
                    Contraseña
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="glass-input h-12"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-13 btn-gradient-primary text-base" 
                  disabled={isLoading}
                >
                  {isLoading ? "Cargando..." : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-slate-700 font-medium">
                    Nombre Completo
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Juan Pérez"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    required
                    className="glass-input h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-700 font-medium">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    className="glass-input h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-700 font-medium">
                    Contraseña
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    className="glass-input h-12"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-13 btn-gradient-primary text-base" 
                  disabled={isLoading}
                >
                  {isLoading ? "Cargando..." : "Crear Cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
