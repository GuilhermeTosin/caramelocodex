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
      "NegÃ³cio Verificado | Caramelinho",
      "Saiba como conquistar o selo NegÃ³cio Verificado no Caramelinho, entender a validade de 12 meses e os critÃ©rios de renovaÃ§Ã£o."
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
            <Link to="/perfil?tab=negocios">Solicitar VerificaÃ§Ã£o</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-8 sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold mb-4">
              <BadgeCheck className="w-4 h-4" />
              Programa NegÃ³cio Verificado
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Ganhe o selo de confianÃ§a no Caramelinho
            </h1>
            <p className="text-muted-foreground mt-4 max-w-3xl">
              O selo <strong>NegÃ³cio Verificado</strong> mostra para a comunidade que seu perfil passou por validaÃ§Ã£o.
              Resultado: mais confianÃ§a, mais cliques e mais conversas com clientes.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <h2 className="text-2xl font-bold mb-4">Vantagens de ser verificado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-5 border-border">
              <div className="flex items-center gap-2 font-semibold"><Star className="w-4 h-4 text-amber-500" /> Prioridade nas pesquisas</div>
              <p className="text-sm text-muted-foreground mt-2">
                Perfis verificados tÃªm maior prioridade de exibiÃ§Ã£o nos resultados de busca.
              </p>
            </Card>
            <Card className="p-5 border-border">
              <div className="flex items-center gap-2 font-semibold"><Trophy className="w-4 h-4 text-amber-500" /> ElegÃ­vel para Destaques</div>
              <p className="text-sm text-muted-foreground mt-2">
                Apenas negÃ³cios verificados podem aparecer na seÃ§Ã£o de negÃ³cios em destaque.
              </p>
            </Card>
            <Card className="p-5 border-border">
              <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="w-4 h-4 text-amber-500" /> Mais confianÃ§a do cliente</div>
              <p className="text-sm text-muted-foreground mt-2">
                O badge de verificaÃ§Ã£o melhora a credibilidade e aumenta a taxa de contato.
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
                Ter pelo menos <strong>5 avaliaÃ§Ãµes</strong> na pÃ¡gina do negÃ³cio.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                Ter o <strong>Instagram do negÃ³cio</strong> cadastrado no perfil.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                Fazer um post sobre o Caramelinho e enviar o <strong>link do post marcando nosso perfil</strong>.
              </li>
            </ul>
          </Card>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold mb-4">Validade da verificaÃ§Ã£o</h2>
          <Card className="p-6 border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A verificaÃ§Ã£o tem validade de <strong>12 meses</strong>. ApÃ³s esse perÃ­odo, solicitamos uma nova confirmaÃ§Ã£o
              para garantir que o negÃ³cio continua ativo, operando normalmente e com atendimento real ao pÃºblico.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              TambÃ©m revalidamos para confirmar que os dados de contato, localizaÃ§Ã£o e canais oficiais continuam corretos.
              Isso reduz perfis desatualizados e protege a comunidade contra informaÃ§Ãµes enganosas.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Em resumo, a renovaÃ§Ã£o anual mantÃ©m o selo confiÃ¡vel, melhora a qualidade dos resultados de busca e reforÃ§a
              a seguranÃ§a de quem usa o Caramelinho para encontrar serviÃ§os.
            </p>
          </Card>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <h2 className="text-2xl font-bold mb-4">Como funciona a anÃ¡lise</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-border">
              <p className="text-xs font-bold text-muted-foreground">PASSO 1</p>
              <p className="font-semibold mt-1">SolicitaÃ§Ã£o</p>
              <p className="text-sm text-muted-foreground mt-2">VocÃª envia o link do post no painel â€œMeus NegÃ³ciosâ€.</p>
            </Card>
            <Card className="p-5 border-border">
              <p className="text-xs font-bold text-muted-foreground">PASSO 2</p>
              <p className="font-semibold mt-1">RevisÃ£o</p>
              <p className="text-sm text-muted-foreground mt-2">Nosso time valida os critÃ©rios e o conteÃºdo enviado.</p>
            </Card>
            <Card className="p-5 border-border">
              <p className="text-xs font-bold text-muted-foreground">PASSO 3</p>
              <p className="font-semibold mt-1">Resultado</p>
              <p className="text-sm text-muted-foreground mt-2">Aprovado: badge ativo por 12 meses. Rejeitado: vocÃª pode ajustar e reenviar.</p>
            </Card>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}


