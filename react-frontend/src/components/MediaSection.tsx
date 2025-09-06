import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryColor, LEGACY_CATEGORY_MAPPING } from "@/lib/categoryColors";

const featuredContent = [
  {
    title: "Missão Artística Francesa de 1816",
    category: "Eventos",
    categoryColor: getCategoryColor("eventos"),
    description: "A chegada dos artistas franceses ao Brasil e sua influência na arte nacional",
    image: "/placeholder.svg"
  },
  {
    title: "Joaquim Nabuco",
    category: "Pessoas", 
    categoryColor: getCategoryColor("pessoas"),
    description: "Diplomata e abolicionista brasileiro com forte ligação com a França",
    image: "/placeholder.svg"
  },
  {
    title: "Maison de France",
    category: "Instituições",
    categoryColor: getCategoryColor("instituições"), 
    description: "Centro cultural francês no Rio de Janeiro que promoveu intercâmbios artísticos",
    image: "/placeholder.svg"
  }
];

const MediaSection = () => {
  return (
    <section id="destaque" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Conteúdo em Destaque
          </h2>
          <p className="text-muted-foreground">
            Algumas das entradas mais relevantes da nossa enciclopédia
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {featuredContent.map((item, index) => (
            <Card key={index} className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge 
                  className="absolute top-3 left-3 text-xs"
                  style={{
                    backgroundColor: `hsl(var(--${item.categoryColor}))`,
                    color: `hsl(var(--${item.categoryColor}-foreground))`
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
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MediaSection;