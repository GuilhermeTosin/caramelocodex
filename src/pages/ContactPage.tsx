import { Link } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { setSeoMeta } from "@/lib/seo";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitContactMessage } from "@/services/contact";
import { toast } from "sonner";

export default function ContactPage() {
  const { session, unreadMessages } = useAuth();
  const [name, setName] = useState(session?.name || "");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSeoMeta(
      "Contato | Caramelinho",
      "Fale com o time do Caramelinho para dúvidas, suporte e parcerias."
    );
  }, []);

  useEffect(() => {
    if (session?.name) {
      Promise.resolve().then(() => {
        setName(session.name);
      });
    }
  }, [session?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    setSending(true);
    const result = await submitContactMessage({
      name,
      email,
      subject,
      message,
    });
    setSending(false);

    if (!result.ok) {
      toast.error(result.error || "Não foi possível enviar sua mensagem agora.");
      return;
    }

    toast.success("Mensagem enviada com sucesso! Retornaremos em breve.");
    setSubject("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-24">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center">
                <img src="/logo.webp" alt="Caramelinho logo" className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="font-extrabold text-lg sm:text-2xl tracking-tight caramelo-text-gradient truncate">Caramelinho</div>
                <div className="text-[10px] sm:text-sm font-semibold text-foreground/75 whitespace-nowrap overflow-hidden text-ellipsis">{"O SEU FARO FORA DO BRASIL"}</div>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-4">
              {session ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link to="/perfil?tab=mensagens" className="relative group">
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-secondary w-9 h-9 sm:w-10 sm:h-10">
                      <MessageCircle className="w-5 h-5" />
                      {unreadMessages > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/perfil">
                    <Button variant="outline" size="sm" className="rounded-full border-border hover:bg-secondary gap-1.5 sm:gap-2 px-2.5 sm:px-4 h-9 sm:h-10">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="font-medium max-w-[90px] sm:max-w-none truncate">{session.name.split(" ")[0]}</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/entrar">
                    <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">Entrar</Button>
                  </Link>
                  <Link to="/cadastro">
                    <Button size="sm" className="px-6 caramelo-gradient text-white border-0" style={{ borderRadius: "12px" }}>
                      Cadastrar
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Voltar para início
        </Link>
        <h1 className="text-3xl font-bold mt-4">Contato</h1>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Envie sua mensagem</h2>
            <p className="text-muted-foreground mt-2">
              Preencha o formulário abaixo para dúvidas, suporte técnico, parcerias ou solicitações gerais.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="contact-name">Nome *</Label>
                <Input
                  id="contact-name"
                  className="mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label htmlFor="contact-email">E-mail *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  className="mt-1.5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                />
              </div>
              <div>
                <Label htmlFor="contact-subject">Assunto *</Label>
                <Input
                  id="contact-subject"
                  className="mt-1.5"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Dúvida sobre cadastro de negócio"
                />
              </div>
              <div>
                <Label htmlFor="contact-message">Mensagem *</Label>
                <Textarea
                  id="contact-message"
                  className="mt-1.5 min-h-[140px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreva seu pedido com o máximo de detalhes."
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full sm:w-auto">
                {sending ? "Enviando..." : "Enviar mensagem"}
              </Button>
            </form>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold">Outros canais</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">E-mail:</strong>{" "}
                <a href="mailto:contato@caramelinho.com" className="text-primary hover:underline">
                  contato@caramelinho.com
                </a>
              </p>
              <p>
                <strong className="text-foreground">Atendimento:</strong> retorno em até 1 dia útil (estimado).
              </p>
              <p>
                <strong className="text-foreground">Temas comuns:</strong> cadastro de negócio, suporte de conta, denúncias, sugestões e parcerias.
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
