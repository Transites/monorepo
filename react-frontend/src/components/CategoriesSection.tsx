import { User, BookOpen, Calendar, Building2, Briefcase, Users, Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryColor } from "@/lib/categoryColors";

const categories = [
  {
    id: 'pessoas',
    title: 'Pessoas',
    description: 'Indivíduos que participaram dos intercâmbios culturais',
    icon: User,
    color: getCategoryColor('pessoas'),
    examples: 'Escritores, artistas, acadêmicos, diplomatas'
  },
  {
    id: 'obras',
    title: 'Obras',
    description: 'Produções artísticas, literárias e intelectuais',
    icon: BookOpen,
    color: getCategoryColor('obras'),
    examples: 'Livros, pinturas, esculturas, manuscritos'
  },
  {
    id: 'instituicoes',
    title: 'Instituições',
    description: 'Organizações que promoveram os intercâmbios',
    icon: Building2,
    color: getCategoryColor('instituições'),
    examples: 'Universidades, museus, bibliotecas, fundações'
  },
  {
    id: 'empresas',
    title: 'Empresas',
    description: 'Empresas envolvidas nos intercâmbios comerciais',
    icon: Briefcase,
    color: getCategoryColor('empresas'),
    examples: 'Editoras, galerias, importadoras, consultorias'
  },
  {
    id: 'agrupamentos',
    title: 'Agrupamentos',
    description: 'Grupos e coletivos que participaram dos intercâmbios',
    icon: Users,
    color: getCategoryColor('agrupamentos'),
    examples: 'Associações, movimentos, círculos, redes'
  },
  {
    id: 'eventos',
    title: 'Eventos',
    description: 'Acontecimentos significativos nos intercâmbios',
    icon: Calendar,
    color: getCategoryColor('eventos'),
    examples: 'Exposições, conferências, festivais, congressos'
  },
  {
    id: 'conceitos',
    title: 'Conceitos',
    description: 'Ideias e conceitos centrais dos intercâmbios',
    icon: Lightbulb,
    color: getCategoryColor('conceitos'),
    examples: 'Modernismo, cosmopolitismo, identidade, circulação'
  }
];

const CategoriesSection = () => {
  return (
    <section id="categorias" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Explore por Categoria
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Navegue pelos diferentes tipos de entradas organizadas em cinco categorias principais
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.id}
                className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full sm:w-72 lg:w-64`}
                style={{
                  boxShadow: `inset 4px 0 0 hsl(var(--${category.color}))`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `inset 8px 0 0 hsl(var(--${category.color}))`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `inset 4px 0 0 hsl(var(--${category.color}))`;
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