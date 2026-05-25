import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, CheckCircle2, ShieldCheck, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SiteFooter from "@/components/SiteFooter";
import { setSeoMeta } from "@/lib/seo";

export default function VerifiedBusinessInfo() {
  useEffect(() => {
    setSeoMeta(
      "Negócio Verificado | Caramelinho",
      "Saiba como conquistar o selo Negócio Verificado no Caramelinho, entender a validade de 12 meses e os critérios de renovação."
    );
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center">
              <img src="/logo.png" alt="Caramelinho logo" className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-extrabold text-lg sm:text-2xl tracking-tight caramelo-text-gradient truncate">Caramelinho</div>
              <div className="text-[10px] sm:text-sm font-semibold text-foreground/75 whitespace-nowrap overflow-hidden text-ellipsis">O SEU FARO FORA DO BRASIL</div>
            </div>
          </Link>
          <Button asChild className="caramelo-gradient text-white border-0">
            <Link to="/perfil?tab=negocios">Solicitar Verificação</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-8 sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold mb-4">
              <BadgeCheck className="w-4 h-4" />
              Programa Negócio Verificado
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Ganhe o selo de confiança no Caramelinho
            </h1>
            <p className="text-muted-foreground mt-4 max-w-3xl">
              O selo <strong>Negócio Verificado</strong> mostra para a comunidade que seu perfil passou por validação.
              Resultado: mais confiança, mais cliques e mais conversas com clientes.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <h2 className="text-2xl font-bold mb-4">Vantagens de ser verificado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-5 border-border">
              <div className="flex items-center gap-2 font-semibold"><Star className="w-4 h-4 text-amber-500" /> Prioridade nas pesquisas</div>
              <p className="text-sm text-muted-foreground mt-2">
                Perfis verificados têm maior prioridade de exibição nos resultados de busca.
              </p>
            </Card>
            <Card className="p-5 border-border">
              <div className="flex items-center gap-2 font-semibold"><Trophy className="w-4 h-4 text-amber-500" /> Elegível para Destaques</div>
              <p className="text-sm text-muted-foreground mt-2">
                Apenas negócios verificados podem aparecer na seção de negócios em destaque.
              </p>
            </Card>
            <Card className="p-5 border-border">
              <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="w-4 h-4 text-amber-500" /> Mais confiança do cliente</div>
              <p className="text-sm text-muted-foreground mt-2">
                O badge de verificação melhora a credibilidade e aumenta a taxa de contato.
              </p>
            </Card>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold mb-4">Requisitos atuais</h2>
          <Card className="p-6 border-border">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                Ter pelo menos <strong>5 avaliações</strong> na página do negócio.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                Ter o <strong>Instagram do negócio</strong> cadastrado no perfil.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                Fazer um post sobre o Caramelinho e enviar o <strong>link do post marcando nosso perfil</strong>.
              </li>
            </ul>
          </Card>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold mb-4">Validade da verificação</h2>
          <Card className="p-6 border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A verificação tem validade de <strong>12 meses</strong>. Após esse período, solicitamos uma nova confirmação
              para garantir que o negócio continua ativo, operando normalmente e com atendimento real ao público.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Também revalidamos para confirmar que os dados de contato, localização e canais oficiais continuam corretos.
              Isso reduz perfis desatualizados e protege a comunidade contra informações enganosas.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Em resumo, a renovação anual mantém o selo confiável, melhora a qualidade dos resultados de busca e reforça
              a segurança de quem usa o Caramelinho para encontrar serviços.
            </p>
          </Card>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <h2 className="text-2xl font-bold mb-4">Como funciona a análise</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-border">
              <p className="text-xs font-bold text-muted-foreground">PASSO 1</p>
              <p className="font-semibold mt-1">Solicitação</p>
              <p className="text-sm text-muted-foreground mt-2">Você envia o link do post no painel "Meus Negócios".</p>
            </Card>
            <Card className="p-5 border-border">
              <p className="text-xs font-bold text-muted-foreground">PASSO 2</p>
              <p className="font-semibold mt-1">Revisão</p>
              <p className="text-sm text-muted-foreground mt-2">Nosso time valida os critérios e o conteúdo enviado.</p>
            </Card>
            <Card className="p-5 border-border">
              <p className="text-xs font-bold text-muted-foreground">PASSO 3</p>
              <p className="font-semibold mt-1">Resultado</p>
              <p className="text-sm text-muted-foreground mt-2">Aprovado: badge ativo por 12 meses. Rejeitado: você pode ajustar e reenviar.</p>
            </Card>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
