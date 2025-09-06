import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/016cd4f1-53a9-4afa-bf7f-015c51ec76f6.png" 
              alt="Trânsitos Logo" 
              className="h-8 w-8 mr-3"
            />
            <h1 className="text-2xl font-bold text-primary">Trânsitos | Circulations</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#inicio" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Início
            </a>
            <a href="#pesquisar" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Pesquisar
            </a>
            <a href="#sobre" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Sobre
            </a>
            <a href="#contato" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
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