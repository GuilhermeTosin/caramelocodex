import { Link } from "react-router-dom";
import { Compass, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background to-muted/30 text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-amber-200/12 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-emerald-200/12 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 sm:px-6">
        <div className="grid w-full items-center gap-10 md:grid-cols-2 md:gap-12">
          <section className="order-2 md:order-1">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-50/70 px-3 py-1 text-xs font-semibold text-amber-900">
              <Compass className="h-3.5 w-3.5" />
              Erro 404
            </p>
            <h1 className="text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl">
              O Caramelinho farejou...
              <span className="block text-primary">mas não encontrou essa página</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Essa página não está disponível no momento. Mas você pode continuar explorando os melhores negócios brasileiros por aqui.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="min-h-11 px-5">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Voltar para a inicial
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-h-11 px-5">
                <Link to="/buscar">
                  <Search className="mr-2 h-4 w-4" />
                  Ir para buscar
                </Link>
              </Button>
            </div>
          </section>

          <section className="order-1 flex justify-center md:order-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-200/20 blur-2xl" />
              <img
                src="/logo.webp"
                alt="Caramelinho com lupa procurando páginas"
                width={420}
                height={382}
                loading="eager"
                fetchPriority="high"
                className="relative h-auto w-[220px] drop-shadow-lg sm:w-[300px] md:w-[350px]"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
