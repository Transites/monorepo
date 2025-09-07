import { Mail, ExternalLink } from "lucide-react";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

const Footer = () => {
  const { scrollToElement } = useSmoothScroll();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, elementId: string) => {
    e.preventDefault();
    scrollToElement(elementId, 80); // 80px offset for navbar
  };

  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Transitos branding with logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/uploads/016cd4f1-53a9-4afa-bf7f-015c51ec76f6.png"
              alt="Trânsitos Logo" 
              className="h-8 w-8"
            />
            <div>
              <h3 className="text-2xl font-bold">Trânsitos</h3>
              <p className="text-sm text-primary-foreground/80">Enciclopédia Digital</p>
            </div>
          </div>

          {/* Links importantes */}
          <div>
            <h4 className="font-semibold mb-4">Links importantes</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="#sobre" 
                  onClick={(e) => handleNavClick(e, 'sobre')}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  Sobre o projeto
                </a>
              </li>
              <li>
                <a 
                  href="#sobre-nos"
                  onClick={(e) => handleNavClick(e, 'sobre-nos')}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  Quem somos
                </a>
              </li>
              <li>
                <a 
                  href="#categorias"
                  onClick={(e) => handleNavClick(e, 'categorias')}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  Categorias
                </a>
              </li>
              <li>
                <a 
                  href="#destaque"
                  onClick={(e) => handleNavClick(e, 'destaque')}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  Conteúdo em destaque
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div id="contato">
            <h4 className="font-semibold mb-4">Contato</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-primary-foreground/80">
                <Mail className="h-4 w-4 mr-2" />
                contato@transitos.org
              </div>
              <p className="text-primary-foreground/60 text-xs mt-4">
                Uma iniciativa acadêmica dedicada à preservação da memória cultural Brasil-França
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-primary-foreground/60">
              © {new Date().getFullYear()} Projeto Trânsitos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;