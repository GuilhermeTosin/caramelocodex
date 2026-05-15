import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 caramelo-gradient rounded-full flex items-center justify-center mx-auto mb-6">
          <PawPrint className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-6xl font-extrabold mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-2">Página não encontrada</p>
        <p className="text-sm text-muted-foreground mb-8">
          O Caramelinho não achou essa página... Ela fugiu?
        </p>
        <Button asChild className="min-h-11 min-w-[200px] caramelo-gradient text-white border-0">
          <Link to="/">Voltar ao Início</Link>
        </Button>
      </div>
    </div>
  );
}
