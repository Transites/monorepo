import { useMemo } from 'react';
import { Calendar, User, Tag, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { addHeadingIds, enhanceContentParagraphs } from '@/lib/content-utils';
import { Submission } from '@/lib/api';
import DOMPurify from 'dompurify';
import { useImageOrientation } from '@/hooks/use-image-orientation';

type ImageOrientation = 'portrait' | 'landscape' | 'square' | 'loading';

// Add this helper function after imports
const getImageClasses = (orientation: ImageOrientation, isLoading: boolean) => {
  const baseClasses = "rounded-lg shadow-lg transition-all duration-300";
  
  if (isLoading) {
    return `${baseClasses} w-full h-auto object-cover max-h-[500px] md:max-h-[600px] opacity-90`;
  }
  
  switch (orientation) {
    case 'portrait':
      return `${baseClasses} h-auto object-contain max-h-[600px] md:max-h-[700px] mx-auto max-w-[400px] md:max-w-[500px]`;
    case 'landscape':
      return `${baseClasses} w-full h-auto object-cover max-h-[500px] md:max-h-[600px]`;
    case 'square':
      return `${baseClasses} h-auto object-contain max-h-[500px] md:max-h-[600px] mx-auto max-w-[500px] md:max-w-[600px]`;
    default:
      return `${baseClasses} w-full h-auto object-cover max-h-[500px] md:max-h-[600px]`;
  }
};

interface ArticleContentProps {
  article: Submission;
}

export default function ArticleContent({ article }: ArticleContentProps) {
  const sanitizedContent = useMemo(() => {
    if (!article?.content_html) return '';
    
    // First, enhance paragraphs to ensure proper spacing
    const contentWithParagraphs = enhanceContentParagraphs(article.content_html);
    
    // Then add heading IDs as before
    const contentWithIds = addHeadingIds(contentWithParagraphs);
    
    // Finally sanitize
    return DOMPurify.sanitize(contentWithIds, {
      ADD_ATTR: ['id', 'class'],
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'img', 'br', 'hr'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'id', 'class']
    });
  }, [article?.content_html]);

  // In the component, add this before the return statement
  const { orientation, isLoading } = useImageOrientation(article.metadata?.image?.url);

  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <article className="space-y-8">
      {/* Article Header */}
      <header className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
            {article.title}
          </h1>
          
          {article.summary && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {article.summary}
            </p>
          )}
        </div>

        {/* Article Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {article.author_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Por <span className="font-medium">{article.author_name}</span></span>
            </div>
          )}

          {(article.created_at || article.updated_at) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {article.updated_at 
                  ? `Atualizado em ${formatDate(article.updated_at)}`
                  : `Publicado em ${formatDate(article.created_at)}`
                }
              </span>
            </div>
          )}
        </div>

        {/* Additional Metadata from submission */}
        {article.metadata && (
          <div className="space-y-4">
            {/* Birth and Death Dates */}
            {(article.metadata.birth || article.metadata.death) && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {article.metadata.birth && (article.metadata.birth.formatted || article.metadata.birth.date) && (
                  <span>Nascimento: {article.metadata.birth.formatted || article.metadata.birth.date}</span>
                )}
                {article.metadata.death && (article.metadata.death.formatted || article.metadata.death.date) && (
                  <span>Morte: {article.metadata.death.formatted || article.metadata.death.date}</span>
                )}
              </div>
            )}

            {/* Occupation */}
            {article.metadata.occupation && article.metadata.occupation.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Ocupação</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.metadata.occupation.map((occupation: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs capitalize">
                      {occupation}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Organizations */}
            {article.metadata.organizations && article.metadata.organizations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Organizações</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.metadata.organizations.map((org: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {org}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Alternative Names */}
            {article.metadata.alternativeNames && article.metadata.alternativeNames.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Tag className="h-4 w-4" />
                  <span>Nomes alternativos</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.metadata.alternativeNames.map((name: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Keywords */}
        {article.keywords && article.keywords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Tag className="h-4 w-4" />
              <span>Palavras-chave</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {article.keywords.map((keyword: string, index: number) => (
                <Badge key={index} variant="default" className="text-xs capitalize">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Article Image */}
        {article.metadata?.image && (
          <section className="space-y-4">
            <div className="relative">
              <div className="flex justify-center">
                <img
                  src={article.metadata.image.url}
                  alt={article.metadata.image.alternativeText || article.metadata.image.caption || article.title}
                  className={getImageClasses(orientation, isLoading)}
                  loading="eager"
                />
              </div>
              
              {/* Image Caption */}
              {article.metadata.image.caption && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    {article.metadata.image.caption}
                  </p>
                  
                  {/* Image Credit */}
                  {article.metadata.image.credit && (
                    <p className="text-xs text-muted-foreground">
                      Crédito: {article.metadata.image.credit}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

      </header>

      {/* Resumo Section */}
      {article.summary && (
        <section id="resumo" className="space-y-4">
          <Separator />
          <h2 className="text-2xl font-bold text-foreground">Resumo</h2>
          <p className="text-lg text-foreground leading-relaxed">
            {article.summary}
          </p>
        </section>
      )}

      {/* Biografia Section (Main Content) */}
      {sanitizedContent && (
        <section id="biografia" className="space-y-6">
          <Separator />
          <h2 className="text-2xl font-bold text-foreground">Biografia</h2>
          <div 
            className="prose prose-gray dark:prose-invert max-w-none
                       prose-headings:text-foreground prose-headings:font-semibold
                       prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8
                       prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-6
                       prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-5
                       prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4
                       prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                       prose-strong:text-foreground prose-strong:font-semibold
                       prose-ul:text-foreground prose-ol:text-foreground
                       prose-li:text-foreground prose-li:mb-1
                       prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </section>
      )}

      {/* Principais Obras Section */}
      {article.metadata?.works && article.metadata.works.length > 0 && (
        <section id="principais-obras" className="space-y-6">
          <Separator />
          <h2 className="text-2xl font-bold text-foreground">Principais Obras</h2>
          <div className="grid gap-4">
            {article.metadata.works
              .sort((a, b) => parseInt(a.year) - parseInt(b.year))
              .map((work, index) => (
                <Card key={index} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <Badge variant="outline" className="self-start sm:self-center whitespace-nowrap">
                        {work.year}
                      </Badge>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-foreground leading-tight">
                          {work.title}
                        </h3>
                        {(work.location || work.publisher) && (
                          <p className="text-sm text-muted-foreground">
                            {work.location && work.publisher 
                              ? `${work.location}: ${work.publisher}`
                              : work.location || work.publisher
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </div>
        </section>
      )}

      {/* Bibliografia Section */}
      {article.metadata?.bibliography && article.metadata.bibliography.length > 0 && (
        <section id="bibliografia" className="space-y-6">
          <Separator />
          <h2 className="text-2xl font-bold text-foreground">Bibliografia</h2>
          <div className="space-y-4">
            {article.metadata.bibliography
              .sort((a, b) => parseInt(a.year) - parseInt(b.year))
              .map((item, index) => (
                <div key={index} className="p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <Badge variant="secondary" className="self-start sm:self-center whitespace-nowrap">
                        {item.year}
                      </Badge>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {item.author}
                        </p>
                        <p className="text-foreground font-semibold">
                          {item.title}
                        </p>
                        {(item.location || item.publisher) && (
                          <p className="text-sm text-muted-foreground italic">
                            {item.location && item.publisher 
                              ? `${item.location}: ${item.publisher}`
                              : item.location || item.publisher
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </section>
      )}

      {/* Related Articles Section - Placeholder */}
      {/* <div className="pt-8">
        <Separator className="mb-8" />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Artigos Relacionados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Funcionalidade de artigos relacionados será implementada em breve.
            </p>
          </CardContent>
        </Card>
      </div> */}
    </article>
  );
}