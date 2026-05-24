import { Link } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { setSeoMeta } from "@/lib/seo";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";

export default function PrivacyPage() {
  const { session, unreadMessages } = useAuth();

  useEffect(() => {
    setSeoMeta(
      "Política de Privacidade | Caramelinho",
      "Entenda como o Caramelinho coleta, usa e protege dados pessoais."
    );
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-24">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center">
                <img src="/logo.png" alt="Caramelinho logo" className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110" />
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
        <h1 className="text-3xl font-bold mt-4">Política de Privacidade</h1>
        <div className="mt-6 rounded-xl border border-border bg-card p-6 sm:p-8">
          <p className="text-muted-foreground leading-relaxed">
            A Caramelinho tem o compromisso de proteger a privacidade e a segurança dos dados de nossos usuários e anunciantes.
            Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações ao acessar nosso site, aplicativo e serviços relacionados.
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Ao utilizar a Caramelinho, você concorda com as práticas descritas neste documento.
          </p>

          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-bold">1. Informações que Coletamos</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Para o funcionamento adequado da nossa plataforma de diretório de negócios, podemos coletar os seguintes tipos de informações:
              </p>
              <ul className="mt-3 list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Informações fornecidas por você:</strong> dados inseridos ao criar uma conta, preencher um formulário de contato, avaliar um estabelecimento ou cadastrar um negócio (como nome, e-mail, telefone, endereço comercial e fotos).</li>
                <li><strong className="text-foreground">Dados de localização (GPS):</strong> solicitamos e coletamos informações sobre sua localização geográfica em tempo real exclusivamente para fornecer a melhor experiência de usuário e exibir os resultados locais mais relevantes para você. Esse recurso permite que você encontre os negócios brasileiros mais próximos. Você pode desativar o acesso à sua localização a qualquer momento nas configurações do seu dispositivo ou navegador.</li>
                <li><strong className="text-foreground">Informações coletadas automaticamente:</strong> dados de navegação, endereço IP, tipo de navegador, sistema operacional, páginas visitadas e tempo de permanência na plataforma, coletados por meio de cookies e tecnologias semelhantes para fins de otimização de performance.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold">2. Como Usamos as Suas Informações</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                As informações que coletamos são utilizadas estritamente para manter e melhorar o funcionamento da Caramelinho.
                Utilizamos seus dados para:
              </p>
              <ul className="mt-3 list-disc pl-6 text-muted-foreground space-y-2">
                <li>Exibir os negócios e prestadores de serviços mais próximos à sua localização atual.</li>
                <li>Permitir a criação e o gerenciamento de perfis de usuários e anunciantes.</li>
                <li>Processar suas avaliações, comentários e interações com as listagens.</li>
                <li>Melhorar a segurança da plataforma e prevenir atividades fraudulentas.</li>
                <li>Enviar comunicações administrativas, como atualizações de termos, alertas de segurança ou respostas a contatos de suporte.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold">3. Compartilhamento de Dados e Privacidade</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                A Caramelinho respeita profundamente a sua privacidade. Estabelecemos as seguintes diretrizes sobre o compartilhamento de informações:
              </p>
              <ul className="mt-3 list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Não vendemos seus dados:</strong> sob nenhuma circunstância a Caramelinho vende, aluga, cede ou comercializa as informações pessoais, dados de contato ou histórico de navegação de seus usuários para terceiros, agências de marketing ou corretores de dados (data brokers).</li>
                <li><strong className="text-foreground">Perfis públicos:</strong> as informações que você decide publicar ao cadastrar um negócio ou fazer uma avaliação (como nome da empresa, endereço, fotos, descrição e comentários) tornam-se de domínio público na plataforma para que outros usuários possam encontrá-lo.</li>
                <li><strong className="text-foreground">Prestadores de serviços técnicos:</strong> podemos compartilhar dados técnicos de forma restrita com fornecedores de infraestrutura (como provedores de hospedagem de servidores e serviços de mapa), unicamente para garantir o funcionamento técnico da plataforma. Estes fornecedores operam sob rígidos contratos de confidencialidade.</li>
                <li><strong className="text-foreground">Requerimentos legais:</strong> podemos divulgar informações caso sejamos legalmente obrigados a fazê-lo por ordem judicial, intimação ou para proteger os direitos, a propriedade ou a segurança da Caramelinho e de seus usuários.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold">4. Uso de Cookies</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Utilizamos cookies essenciais para manter você conectado à sua conta e cookies de análise para entender como os visitantes interagem com a plataforma.
                Você pode configurar seu navegador para recusar todos os cookies, no entanto, isso pode limitar algumas funcionalidades do site, como a lembrança de suas preferências de busca.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">5. Segurança da Informação</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Adotamos medidas de segurança técnicas e organizacionais padrão da indústria (como criptografia e certificados SSL) para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição acidental.
                Apesar de nossos esforços, nenhum método de transmissão pela internet ou armazenamento eletrônico é 100% seguro; portanto, não podemos garantir segurança absoluta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">6. Seus Direitos</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Você tem controle sobre seus dados pessoais na Caramelinho. A qualquer momento, você pode:
              </p>
              <ul className="mt-3 list-disc pl-6 text-muted-foreground space-y-2">
                <li>Acessar, corrigir ou atualizar as informações do seu perfil diretamente nas configurações da sua conta.</li>
                <li>Revogar as permissões de localização (GPS) através das configurações do seu dispositivo.</li>
                <li>Solicitar a exclusão permanente da sua conta e remoção dos seus dados pessoais e/ou da listagem do seu negócio da nossa base de dados, entrando em contato conosco.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold">7. Links Externos</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Os negócios cadastrados na Caramelinho podem incluir links para seus próprios sites ou redes sociais.
                Esta Política de Privacidade aplica-se apenas à nossa plataforma.
                Não somos responsáveis pelas práticas de privacidade ou pelo conteúdo de sites de terceiros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">8. Alterações nesta Política</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Podemos atualizar nossa Política de Privacidade periodicamente para refletir mudanças em nossas práticas ou por razões operacionais e legais.
                Sempre que houver uma alteração significativa, atualizaremos a data no final desta página.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">9. Contato</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Se você tiver dúvidas, preocupações ou solicitações em relação a esta Política de Privacidade ou ao tratamento de seus dados, entre em contato conosco.
              </p>
            </section>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            <strong className="text-foreground">Última atualização:</strong> 24/05/2026
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
