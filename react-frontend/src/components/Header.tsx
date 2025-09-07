import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const { scrollToElement } = useSmoothScroll();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, elementId: string) => {
    e.preventDefault();
    
    // If we're not on the homepage, navigate there first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        scrollToElement(elementId, 80);
      }, 100);
    } else {
      // If we're already on homepage, just scroll
      scrollToElement(elementId, 80);
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src="/uploads/016cd4f1-53a9-4afa-bf7f-015c51ec76f6.png"
              alt="Trânsitos Logo" 
              className="h-8 w-8 mr-3"
            />
            <h1 className="text-2xl font-bold text-primary">Trânsitos | Circulations</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#inicio" 
              onClick={(e) => handleNavClick(e, 'inicio')}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Início
            </a>
            <a 
              href="#pesquisar" 
              onClick={(e) => handleNavClick(e, 'pesquisar')}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Pesquisar
            </a>
            <a 
              href="#sobre" 
              onClick={(e) => handleNavClick(e, 'sobre')}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Sobre
            </a>
            <a 
              href="#contato" 
              onClick={(e) => handleNavClick(e, 'contato')}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Contato
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;