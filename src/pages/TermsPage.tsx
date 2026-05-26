import { Link } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { setSeoMeta } from "@/lib/seo";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";

export default function TermsPage() {
  const { session, unreadMessages } = useAuth();

  useEffect(() => {
    setSeoMeta(
      "Termos e Condições | Caramelinho",
      "Leia os termos e condições de uso da plataforma Caramelinho."
    );
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
        <h1 className="text-3xl font-bold mt-4">Termos e Condições</h1>
        <div className="mt-6 rounded-xl border border-border bg-card p-6 sm:p-8">
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Bem-vindo(a) à Caramelinho.com.</strong> Este documento rege o uso do nosso site, aplicativo e serviços relacionados.
            Ao acessar ou utilizar a Caramelinho, você concorda expressamente com estes Termos e Condições.
            Caso não concorde com qualquer parte deste documento, solicitamos que não utilize nossos serviços.
          </p>

          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-bold">1. Natureza do Serviço e Papel da Caramelinho</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                A Caramelinho atua exclusivamente como um catálogo digital e um provedor de espaço para listagem de negócios.
                Nosso objetivo é facilitar a localização de empresas e prestadores de serviços, conectando a comunidade.
              </p>
              <ul className="mt-3 list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Não somos intermediários:</strong> A Caramelinho não atua como corretora, representante, agente, garantidora ou parte em qualquer negociação, contrato ou transação realizada entre os usuários do site e os proprietários dos estabelecimentos listados.</li>
                <li><strong className="text-foreground">Mera vitrine:</strong> fornecemos apenas o espaço digital para que negócios apresentem seus produtos e serviços.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold">2. Isenção Absoluta de Responsabilidade (Aviso Legal)</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Ao utilizar este site, você compreende e concorda que a Caramelinho e seus administradores não possuem qualquer responsabilidade sobre as interações, transações ou disputas geradas a partir das listagens do site.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">A Caramelinho se isenta expressamente de responsabilidade sobre:</p>
              <ul className="mt-3 list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Fraudes e golpes:</strong> qualquer ato ilícito, fraude, estelionato ou má-fé praticado por qualquer negócio, empresa ou prestador de serviço listado em nossa plataforma.</li>
                <li><strong className="text-foreground">Qualidade e entrega:</strong> a qualidade, segurança, legalidade, precisão ou entrega de qualquer produto ou serviço anunciado. Não testamos, verificamos ou endossamos os serviços listados.</li>
                <li><strong className="text-foreground">Danos e prejuízos:</strong> danos diretos, indiretos, materiais, morais, lucros cessantes ou quaisquer outros prejuízos resultantes de transações comerciais, contratações de serviços ou interações com as empresas cadastradas.</li>
                <li><strong className="text-foreground">Veracidade das informações:</strong> a exatidão das informações fornecidas pelos anunciantes, incluindo preços, horários de funcionamento, endereços, qualificações e disponibilidade. O usuário deve realizar sua própria diligência (due diligence) antes de fechar qualquer negócio ou realizar pagamentos.</li>
                <li><strong className="text-foreground">Disputas de consumo:</strong> qualquer disputa, reclamação ou processo judicial entre o consumidor e o prestador de serviço/vendedor. A Caramelinho não mediará, arbitrará ou intervirá nestes conflitos.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold">3. Conteúdo Gerado por Terceiros (Anunciantes e Usuários)</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Os perfis, descrições, fotos, logotipos e avaliações presentes na Caramelinho são fornecidos pelos próprios donos dos negócios ou pelos usuários da plataforma.
              </p>
              <ul className="mt-3 list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Responsabilidade do anunciante:</strong> o anunciante é o único e exclusivo responsável por todo o conteúdo que publica, garantindo que possui os direitos autorais das imagens e textos, e que estes não violam leis vigentes ou direitos de terceiros.</li>
                <li><strong className="text-foreground">Direito de remoção:</strong> a Caramelinho reserva-se o direito (mas não a obrigação) de monitorar, editar, recusar ou remover qualquer listagem, conteúdo ou avaliação a qualquer momento, por qualquer motivo, sem aviso prévio e a seu exclusivo critério, especialmente em casos de suspeita de fraude, violação de direitos autorais ou violação destes Termos.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold">4. Links para Sites de Terceiros</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                As listagens em nosso portal podem conter links para sites, redes sociais ou aplicativos externos, pertencentes aos negócios cadastrados.
                A Caramelinho não possui controle sobre esses sites externos e não assume qualquer responsabilidade pelo conteúdo, políticas de privacidade, segurança, ou práticas desses sites.
                O acesso a links de terceiros é feito por sua própria conta e risco.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">5. Disponibilidade do Sistema e Tecnologia</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">Embora nos esforcemos para manter a Caramelinho operacional e livre de erros, não garantimos que:</p>
              <ul className="mt-3 list-disc pl-6 text-muted-foreground space-y-2">
                <li>O site estará ininterruptamente disponível, seguro ou livre de falhas.</li>
                <li>Os defeitos ou erros no software serão corrigidos imediatamente.</li>
                <li>O servidor que hospeda o site está livre de vírus, malwares ou outros componentes nocivos.</li>
              </ul>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                A Caramelinho não se responsabiliza por perdas de dados, lucros cessantes ou danos ao sistema de computador ou dispositivo móvel do usuário em decorrência do uso do nosso site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">6. Propriedade Intelectual</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Todo o conteúdo original da plataforma, incluindo, mas não se limitando a, código-fonte, design, layout, textos informativos, banco de dados, logotipos próprios e identidade visual (incluindo mascotes e marca "Caramelinho"), é de propriedade exclusiva da Caramelinho ou devidamente licenciado, sendo protegido pelas leis de propriedade intelectual e direitos autorais vigentes.
                É expressamente proibida a cópia, reprodução, mineração de dados (web scraping não autorizado) ou distribuição do nosso conteúdo sem autorização prévia por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">7. Indenização</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Você concorda em defender, indenizar e isentar a Caramelinho, seus proprietários, diretores, funcionários e parceiros de toda e qualquer reclamação, responsabilidade, dano, perda ou despesa (incluindo honorários advocatícios razoáveis) que surjam em decorrência de:
              </p>
              <ul className="mt-3 list-disc pl-6 text-muted-foreground space-y-2">
                <li>Seu uso inadequado do site.</li>
                <li>Sua violação destes Termos e Condições.</li>
                <li>Qualquer transação, interação ou disputa que você tenha com outro usuário ou com um negócio listado no site.</li>
                <li>Violação de direitos de terceiros, incluindo direitos autorais ou de privacidade, através do conteúdo que você submeter.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold">8. Alterações nos Termos e Condições</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                A Caramelinho reserva-se o direito de modificar ou substituir estes Termos a qualquer momento.
                As alterações entrarão em vigor imediatamente após a publicação no site.
                O uso contínuo da plataforma após quaisquer alterações constitui a sua aceitação dos novos Termos.
                Recomendamos a revisão periódica desta página.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">9. Legislação Aplicável e Foro</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Estes Termos e Condições serão regidos e interpretados de acordo com as leis aplicáveis.
                Qualquer disputa decorrente ou relacionada a estes Termos será submetida à jurisdição exclusiva dos tribunais competentes de Montreal, QC, Canadá, renunciando expressamente a qualquer outro foro, por mais privilegiado que seja.
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
