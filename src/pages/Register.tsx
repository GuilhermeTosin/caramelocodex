import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setIsLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    setIsLoading(false);

    if (signUpError) {
      if (signUpError.message.includes("already")) {
        setError("Este email já está cadastrado.");
      } else {
        setError(signUpError.message);
      }
      return;
    }

    setStep("confirm");
  };

  if (step === "confirm") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center border-border">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Cadastro realizado!</h1>
          <p className="text-muted-foreground mb-2">
            Enviamos um email de confirmação para <strong>{email}</strong>.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Clique no link enviado para ativar sua conta e começar a usar o Caramelinho.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/entrar")}>
              Ir para o Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Voltar ao Início
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-3 mb-4">
            <div className="w-20 h-20 flex items-center justify-center">
                <img src="/logo.png" alt="Caramelinho logo" className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110" />
              </div>
            <div className="leading-tight text-left">
                <div className="font-extrabold text-[2rem] sm:text-[2.2rem] tracking-tight caramelo-text-gradient">Caramelinho</div>
                <div className="text-base sm:text-lg font-semibold text-foreground/75">{"O SEU FARO FORA DO BRASIL"}</div>
              </div>
          </Link>
        </div>

        <Card className="p-6 sm:p-8 border-border">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Criar Conta</h1>
            <p className="text-muted-foreground mt-1">Junte-se ao Caramelinho!</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="name">Nome</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="pl-10"
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="pl-10"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full caramelo-gradient text-white" disabled={isLoading}>
              {isLoading ? "Cadastrando..." : "Criar Conta"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Já tem conta?{" "}
              <Link to="/entrar" className="text-amber-600 hover:text-amber-700 font-medium">
                Faça login
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}


















