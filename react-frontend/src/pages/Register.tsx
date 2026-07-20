import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react"; // Icons for the success state

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const registerSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

const Register = () => {
  const { createUser, getAuthErrorMessage } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); 
  const [authError, setAuthError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterValues) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await createUser(values.email, values.password);
      setRegisteredEmail(values.email);
      setIsSuccess(true); 
    } catch (error) {
      const message = getAuthErrorMessage(error) 
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-sm">
          
          {!isSuccess ? (
            /* --- REGISTRATION FORM --- */
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Criar conta
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cadastre-se para enviar seus artigos para o projeto Trânsitos
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                {authError && (
                  <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                    {authError}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none">E-mail</label>
                    <input
                      {...register("email")}
                      id="email"
                      type="email"
                      placeholder="exemplo@usp.br"
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        errors.email && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none">Senha</label>
                    <input
                      {...register("password")}
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        errors.password && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">Confirmar Senha</label>
                    <input
                      {...register("confirmPassword")}
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        errors.confirmPassword && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Processando..." : "Registrar-se"}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                Já possui uma conta?{" "}
                <button onClick={() => navigate("/login")} className="font-medium text-primary hover:underline">
                  Entrar
                </button>
              </div>
            </>
          ) : (
            /* --- EMAIL CONFIRMATION WAITING SCREEN --- */
            <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-center">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Mail className="h-12 w-12 text-primary animate-bounce" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Verifique seu e-mail</h2>
                <p className="text-muted-foreground">
                  Enviamos um link de confirmação para: <br />
                  <span className="font-semibold text-foreground">{registeredEmail}</span>
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg text-sm text-left space-y-3 border border-border">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <p>Clique no link no e-mail para ativar sua conta.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <p>Após confirmar, você poderá fazer login e enviar seus artigos.</p>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
                  Ir para o Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Não recebeu o e-mail? Verifique sua caixa de spam.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;