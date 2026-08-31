import { Mail } from "lucide-react";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { scrollToElement } = useSmoothScroll();
  const { t } = useTranslation(["navigation", "common"]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, elementId: string) => {
    e.preventDefault();
    scrollToElement(elementId, 80); // 80px offset for navbar
  };

  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex items-center gap-3">
            <img 
              src="/uploads/016cd4f1-53a9-4afa-bf7f-015c51ec76f6.png"
              alt="Trânsitos Logo" 
              className="h-8 w-8"
            />
            <div>
              <h3 className="text-2xl font-bold">Trânsitos</h3>
              <p className="text-sm text-primary-foreground/80">{t("navigation:footer.digitalEncyclopedia")}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("navigation:footer.importantLinks")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="#sobre" 
                  onClick={(e) => handleNavClick(e, 'sobre')}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  {t("navigation:footer.aboutProject")}
                </a>
              </li>
              <li>
                <a 
                  href="#sobre-nos"
                  onClick={(e) => handleNavClick(e, 'sobre-nos')}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  {t("navigation:footer.whoWeAre")}
                </a>
              </li>
              <li>
                <a 
                  href="#categorias"
                  onClick={(e) => handleNavClick(e, 'categorias')}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  {t("navigation:footer.categories")}
                </a>
              </li>
              <li>
                <a 
                  href="#destaque"
                  onClick={(e) => handleNavClick(e, 'destaque')}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  {t("navigation:footer.featuredContent")}
                </a>
              </li>
            </ul>
          </div>

          <div id="contato">
            <h4 className="font-semibold mb-4">{t("navigation:footer.contact")}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-primary-foreground/80">
                <Mail className="h-4 w-4 mr-2" />
                enciclopedia.iea.usp@gmail.com
              </div>
              <p className="text-primary-foreground/60 text-xs mt-4">
                {t("navigation:footer.initiative")}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-primary-foreground/60">
            {t("navigation:footer.rights", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;