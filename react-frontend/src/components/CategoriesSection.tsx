import { User, BookOpen, Calendar, Building2, Briefcase, Users, Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryColor } from "@/lib/categoryColors";
import { useTranslation } from "react-i18next";

const CategoriesSection = () => {
  const { t } = useTranslation(["content"]);
  
  const categories = [
    {
      id: 'pessoas',
      title: t('content:categories.pessoas.title'),
      description: t('content:categories.pessoas.description'),
      icon: User,
      color: getCategoryColor('pessoas'),
      examples: t('content:categories.pessoas.examples')
    },
    {
      id: 'obras',
      title: t('content:categories.obras.title'),
      description: t('content:categories.obras.description'),
      icon: BookOpen,
      color: getCategoryColor('obras'),
      examples: t('content:categories.obras.examples')
    },
    {
      id: 'instituicoes',
      title: t('content:categories.instituicoes.title'),
      description: t('content:categories.instituicoes.description'),
      icon: Building2,
      color: getCategoryColor('instituições'),
      examples: t('content:categories.instituicoes.examples')
    },
    {
      id: 'empresas',
      title: t('content:categories.empresas.title'),
      description: t('content:categories.empresas.description'),
      icon: Briefcase,
      color: getCategoryColor('empresas'),
      examples: t('content:categories.empresas.examples')
    },
    {
      id: 'agrupamentos',
      title: t('content:categories.agrupamentos.title'),
      description: t('content:categories.agrupamentos.description'),
      icon: Users,
      color: getCategoryColor('agrupamentos'),
      examples: t('content:categories.agrupamentos.examples')
    },
    {
      id: 'eventos',
      title: t('content:categories.eventos.title'),
      description: t('content:categories.eventos.description'),
      icon: Calendar,
      color: getCategoryColor('eventos'),
      examples: t('content:categories.eventos.examples')
    },
    {
      id: 'conceitos',
      title: t('content:categories.conceitos.title'),
      description: t('content:categories.conceitos.description'),
      icon: Lightbulb,
      color: getCategoryColor('conceitos'),
      examples: t('content:categories.conceitos.examples')
    }
  ];
  return (
    <section id="categorias" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t("content:categories.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("content:categories.description")}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              // TODO: Not using cursor pointer for now. Add it back once integration with search for category is done.
              <Card
                key={category.id}
                className={`group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full sm:w-72 lg:w-64`}
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