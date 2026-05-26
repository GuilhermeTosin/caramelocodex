import { Link } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let meta = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

export default function AboutPage() {
  const { session, unreadMessages } = useAuth();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const title = "Sobre Nós | Caramelinho";
    const description =
      "Conheça a Caramelinho.com: conectamos brasileiros no exterior aos melhores negócios da comunidade, com busca local inteligente e foco em confiança.";
    const canonicalUrl = "https://www.caramelinho.com/sobre";
    const imageUrl = "https://www.caramelinho.com/logo.png";

    document.title = title;
    setMetaTag("name", "description", description);
    setMetaTag("name", "robots", "index,follow,max-image-preview:large");

    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:locale", "pt_BR");
    setMetaTag("property", "og:site_name", "Caramelinho");
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", canonicalUrl);
    setMetaTag("property", "og:image", imageUrl);
    setMetaTag("property", "og:image:alt", "Mascote do Caramelinho com lupa");

    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", imageUrl);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);
  }, []);

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
        <h1 className="text-3xl font-bold mt-4">Sobre Nós</h1>

        <section className="mt-6 rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-100 via-amber-50 to-sky-100 p-3 sm:p-4">
          <div className="flex justify-center">
            <img
              src="/logo.webp"
              alt="Mascote Caramelinho farejando negócios brasileiros pelo mundo"
              title="Caramelinho - O seu faro fora do Brasil"
              width={280}
              height={280}
              decoding="async"
              fetchPriority="high"
              loading="eager"
              className="w-full max-w-[220px] sm:max-w-[280px] h-auto object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.12)]"
            />
          </div>
        </section>

        <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
          <p>
            Bem-vindo(a) à <strong className="text-foreground">Caramelinho.com</strong>, o ponto de encontro da comunidade brasileira pelo mundo!
          </p>
          <p>
            Sabemos que, não importa onde estejamos no globo, sempre bate aquela saudade de casa: do tempero da nossa comida, do calor do nosso povo e do nosso jeito único de fazer negócios e prestar serviços. Foi para encurtar essa distância e fortalecer nossos laços que a Caramelinho nasceu.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-3">Nossa Missão</h2>
          <p>Nossa missão é simples e poderosa: conectar a comunidade brasileira no exterior aos produtos e serviços que amamos.</p>
          <p>
            Através da nossa plataforma web e aplicativo móvel, utilizamos tecnologia de geolocalização inteligente para ajudar você a encontrar os negócios brasileiros mais próximos. Seja um salão de beleza que entende o seu cabelo, um mercado com nossos produtos típicos, ou profissionais de confiança que falam a nossa língua, nós colocamos tudo isso na palma da sua mão.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-3">Por que "Caramelinho"?</h2>
          <p>
            Se existe um símbolo que representa perfeitamente o espírito brasileiro, é o nosso querido vira-lata caramelo. Ele é simpático, resiliente, adaptável, está em toda parte e sempre nos recebe com alegria.
          </p>
          <p>
            Nosso mascote e a identidade da nossa marca nasceram dessa inspiração. O "Caramelinho" é o seu guia fiel para farejar e encontrar os melhores negócios da nossa comunidade, fazendo você se sentir em casa, não importa a qual distância esteja do Brasil.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-3">Onde Estamos</h2>
          <p>
            Nossa comunidade não tem fronteiras. Embora tenhamos dado nossos primeiros passos com um forte foco na América do Norte, nossa visão é global. Queremos mapear e apoiar o empreendedorismo brasileiro em todos os cantos do mundo.
          </p>

          <h2 className="text-2xl font-semibold text-foreground pt-3">O Que Oferecemos</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Para o Consumidor:</strong> Uma ferramenta fácil e rápida para encontrar serviços, lojas e profissionais brasileiros perto de você, fortalecendo a rede de apoio da nossa comunidade.
            </li>
            <li>
              <strong className="text-foreground">Para o Empreendedor:</strong> Uma vitrine digital poderosa para destacar o seu negócio, atrair clientes que buscam a qualidade do serviço brasileiro e crescer em um mercado internacional.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground pt-3">Faça Parte da Nossa Matilha!</h2>
          <p>
            A Caramelinho é feita por brasileiros, para brasileiros. Convidamos você a explorar, descobrir novos lugares, avaliar seus negócios favoritos e, se você for um empreendedor, cadastrar o seu serviço.
          </p>
          <p>Vamos juntos mostrar a força e o talento da nossa comunidade pelo mundo!</p>
          <p className="font-semibold text-foreground">Caramelinho.com – O seu faro para os melhores negócios brasileiros.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
