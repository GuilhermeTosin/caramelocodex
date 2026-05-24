import { Link } from "react-router-dom";
import { MapPin, Store, ShieldCheck, MessageCircle, FileText, ScrollText, Info, Mail } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="group flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.png" alt="Caramelinho logo" className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110" />
              </div>
              <div className="leading-tight">
                <div className="font-extrabold text-base tracking-tight caramelo-text-gradient">Caramelinho</div>
                <div className="text-[11px] font-semibold tracking-wide text-amber-200">{"O SEU FARO FORA DO BRASIL"}</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400 max-w-md leading-relaxed">
              Encontre negócios brasileiros onde você estiver. Busca local, contato direto e informações confiáveis em um só lugar.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Navegação</h4>
            <div className="space-y-2 text-sm">
              <Link to="/buscar" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <MapPin className="w-4 h-4" />
                Buscar negócios
              </Link>
              <Link to="/cadastro" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <Store className="w-4 h-4" />
                Cadastrar negócio
              </Link>
              <Link to="/entrar" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4" />
                Entrar na conta
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Institucional</h4>
            <div className="space-y-2 text-sm">
              <Link to="/sobre" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <Info className="w-4 h-4" />
                Sobre
              </Link>
              <Link to="/contato" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                Contato
              </Link>
              <Link to="/privacidade" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <FileText className="w-4 h-4" />
                Privacidade
              </Link>
              <Link to="/termos" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ScrollText className="w-4 h-4" />
                Termos e Condições
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Confiança</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <p className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-400" />
                Perfis com solicitação de ownership para donos reais.
              </p>
              <p>Atualizado para conectar comunidades brasileiras no mundo todo.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p>© 2026 Caramelinho.com. Todos os direitos reservados.</p>
          <p>Feito para facilitar a vida de quem mora fora.</p>
        </div>
      </div>
    </footer>
  );
}







