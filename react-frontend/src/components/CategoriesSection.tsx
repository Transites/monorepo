import { User, BookOpen, Calendar, Building2, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const categories = [
  {
    id: "pessoa",
    title: "Pessoa",
    description: "Personalidades que conectaram Brasil e França através da história",
    icon: User,
    color: "pessoa",
    examples: "Escritores, artistas, diplomatas, intelectuais"
  },
  {
    id: "obra",
    title: "Obra",
    description: "Criações artísticas e literárias que marcaram os intercâmbios culturais",
    icon: BookOpen,
    color: "obra",
    examples: "Livros, pinturas, filmes, composições musicais"
  },
  {
    id: "evento",
    title: "Evento",
    description: "Acontecimentos históricos que fortaleceram as relações bilaterais",
    icon: Calendar,
    color: "evento",
    examples: "Exposições, festivais, conferências, celebrações"
  },
  {
    id: "organizacao",
    title: "Organização",
    description: "Instituições que promoveram intercâmbios e cooperação cultural",
    icon: Building2,
    color: "organizacao",
    examples: "Universidades, museus, centros culturais, fundações"
  },
  {
    id: "empresa",
    title: "Empresa",
    description: "Empresas que facilitaram conexões comerciais e culturais",
    icon: Briefcase,
    color: "empresa",
    examples: "Editoras, produtoras, importadoras, consultorias"
  }
];

const CategoriesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Explore por Categoria
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Navegue pelos diferentes tipos de entradas organizadas em cinco categorias principais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.id}
                className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 hover:border-l-8`}
                style={{
                  borderLeftColor: `hsl(var(--${category.color}))`
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div 
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: `hsl(var(--${category.color}) / 0.1)`,
                        color: `hsl(var(--${category.color}))`
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm leading-relaxed">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground italic">
                    {category.examples}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;