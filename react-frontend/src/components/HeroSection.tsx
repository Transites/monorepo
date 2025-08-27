import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const suggestions = [
    "Machado de Assis",
    "Alliance Française",
    "Semana de Arte Moderna",
    "Jean-Baptiste Debret",
    "Festival de Cannes"
  ];

  return (
    <section id="inicio" className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Enciclopédia Digital dos
            <span className="block text-primary mt-2">
              Intercâmbios Brasil-França
            </span>
          </h1>

          {/* Hero Description */}
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Explore séculos de relações culturais, artísticas e intelectuais entre o Brasil e a França. 
            Uma plataforma acadêmica dedicada aos trânsitos, trocas e influências mútuas que moldaram 
            nossa história cultural.
          </p>

          {/* Search Section */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="Pesquise pessoas, obras, eventos, organizações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 text-lg pl-6 pr-20 rounded-full border-2 focus:border-primary"
              />
              <Button 
                className="absolute right-2 top-2 h-10 px-6 rounded-full"
                onClick={() => console.log('Searching for:', searchQuery)}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>

            {/* Search Suggestions */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-muted-foreground">Sugestões:</span>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setSearchQuery(suggestion)}
                  className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="mt-16">
            <ChevronDown className="h-6 w-6 text-muted-foreground animate-bounce mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Explore as categorias</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;