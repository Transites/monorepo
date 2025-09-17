import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryColor } from "@/lib/categoryColors";
import { useFeaturedContent } from "@/hooks/use-featured-content";

const MediaSection = () => {
  const { data: featuredContent, isLoading, error } = useFeaturedContent();

  // Loading state
  if (isLoading) {
    return (
      <section id="destaque" className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Conteúdo em destaque
            </h2>
            <p className="text-muted-foreground">
              Carregando conteúdo em destaque...
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Error state with fallback
  if (error || !featuredContent) {
    console.error('Featured content error:', error);
    // Could implement fallback to static content here if needed
    return null;
  }
  return (
    <section id="destaque" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Conteúdo em destaque
          </h2>
          <p className="text-muted-foreground">
            Conteúdo selecionado em História, Política e Cultura
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {featuredContent.map((item) => {
            const categoryColor = getCategoryColor(item.category);
            return (
              <Card key={item.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img 
                    src={item.metadata?.image?.url || '/placeholder.svg'} 
                    alt={item.metadata?.image?.alternativeText || item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge 
                    className="absolute top-3 left-3 text-xs capitalize"
                    style={{
                      backgroundColor: `hsl(var(--${categoryColor}))`,
                      color: `hsl(var(--${categoryColor}-foreground))`
                    }}
                  >
                    {item.category}
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.summary || 'Resumo não disponível.'}
                  </p>
                  {item.author_name && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Por {item.author_name}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MediaSection;