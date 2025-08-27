import { ArrowRight, Globe, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const AboutSection = () => {
  return (
    <section id="sobre" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Sobre o Projeto Trânsitos
            </h2>
            <p className="text-lg text-muted-foreground">
              Uma iniciativa acadêmica dedicada ao mapeamento e preservação da memória cultural
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-0 shadow-md">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Globe className="h-8 w-8 text-primary mr-3" />
                  <h3 className="text-xl font-semibold">Missão</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Documentar e tornar acessível o rico patrimônio de intercâmbios culturais, 
                  artísticos e intelectuais entre Brasil e França, preservando essa memória 
                  para futuras gerações de pesquisadores e interessados.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <BookOpen className="h-8 w-8 text-primary mr-3" />
                  <h3 className="text-xl font-semibold">Metodologia</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Baseada em rigorosa pesquisa acadêmica, a enciclopédia utiliza fontes 
                  primárias e secundárias confiáveis, organizando informações de forma 
                  sistemática e acessível para diferentes públicos.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" className="group">
              Saiba mais sobre o projeto
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;