import { Mail, ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-2">Trânsitos</h3>
            <p className="text-primary-foreground/80 text-sm">
              Enciclopédia Digital dos Intercâmbios Brasil-França
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Links Úteis</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#sobre" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors flex items-center">
                  Sobre o Projeto
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="#metodologia" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Metodologia
                </a>
              </li>
              <li>
                <a href="#creditos" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Créditos
                </a>
              </li>
              <li>
                <a href="#colabore" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Como Colaborar
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
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
            © 2024 Projeto Trânsitos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;