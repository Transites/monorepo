import { useState, useMemo } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { extractHeadingsFromHtml, type HeadingInfo } from '@/lib/content-utils';
import { useScrollSpy } from '@/hooks/use-scroll-spy';
import { Submission } from '@/lib/api';

interface TableOfContentsProps {
  article: Submission;
  className?: string;
}

interface NavigationSection {
  id: string;
  title: string;
  available: boolean;
  subsections?: HeadingInfo[];
}

export default function TableOfContents({ article, className }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Extract subsections from HTML content for the "Biografia" section
  const biografiaSubsections = useMemo(() => {
    if (!article?.content_html) return [];
    return extractHeadingsFromHtml(article.content_html);
  }, [article?.content_html]);

  // Define fixed navigation structure based on visual reference
  const navigationSections = useMemo((): NavigationSection[] => [
    {
      id: 'resumo',
      title: 'Resumo',
      available: !!(article?.summary),
    },
    {
      id: 'biografia',
      title: 'Biografia',
      available: !!(article?.content_html),
      subsections: biografiaSubsections,
    },
    {
      id: 'principais-obras',
      title: 'Principais Obras',
      available: !!(article?.metadata?.works && article.metadata.works.length > 0),
    },
    {
      id: 'bibliografia',
      title: 'Bibliografia',
      available: !!(article?.metadata?.bibliography && article.metadata.bibliography.length > 0),
    },
  ], [article?.summary, article?.content_html, article?.metadata?.works, article?.metadata?.bibliography, biografiaSubsections]);

  // Get all scrollable IDs for scroll spy (main sections + subsections)
  const allScrollableIds = useMemo(() => {
    const mainIds = navigationSections.filter(section => section.available).map(section => section.id);
    const subIds = biografiaSubsections.map(h => h.id);
    return [...mainIds, ...subIds];
  }, [navigationSections, biografiaSubsections]);

  const { activeId, scrollToHeading } = useScrollSpy(allScrollableIds);

  // Don't render if no sections are available
  const availableSections = navigationSections.filter(section => section.available);
  if (availableSections.length === 0) {
    return null;
  }

  const handleSectionClick = (id: string) => {
    scrollToHeading(id);
    setIsOpen(false);
  };

  const renderMainSection = (section: NavigationSection) => (
    <li key={section.id}>
      <button
        onClick={() => handleSectionClick(section.id)}
        className={cn(
          "block w-full text-left text-sm py-2 px-3 rounded-lg transition-colors duration-150 ease-out",
          "text-muted-foreground hover:text-foreground font-medium",
          "hover:bg-muted/50",
          activeId === section.id && "bg-primary/15 text-primary shadow-sm border-l-2 border-primary"
        )}
      >
        {section.title}
      </button>
      
      {/* Render subsections if available and this is the biografia section */}
      {section.id === 'biografia' && section.subsections && section.subsections.length > 0 && (
        <ul className="ml-4 mt-2 space-y-0.5">
          {section.subsections.map(renderSubsection)}
        </ul>
      )}
    </li>
  );

  const renderSubsection = (heading: HeadingInfo) => (
    <li key={heading.id}>
      <button
        onClick={() => handleSectionClick(heading.id)}
        className={cn(
          "block w-full text-left text-xs py-1.5 px-2 rounded-md transition-colors duration-100 ease-out",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-muted/30",
          activeId === heading.id && "bg-primary/10 text-primary font-medium border-l border-primary/50",
          heading.level > 2 && "ml-2",
          heading.level > 3 && "ml-4"
        )}
      >
        {heading.text}
      </button>
    </li>
  );

  return (
    <>
      {/* Mobile Sticky TOC Navigation - positioned to break out of grid */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3">
          <div className="relative">
            {/* Scroll indicator gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/95 to-transparent z-10 pointer-events-none" />
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {availableSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-150 ease-out",
                    "border border-border/50 hover:border-primary/50",
                    activeId === section.id
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Toggle Button (Backup - for overlay mode if needed) */}
      <div className="hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          <span>Índice</span>
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Desktop Table of Contents Sidebar */}
      <div className={cn(
        // Desktop: sticky positioning accounting for header height (64px + 16px margin)
        "lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:z-40",
        // Mobile: hidden (using mobile sticky nav instead)
        "hidden lg:block",
        className
      )}>
        <Card className="shadow-sm bg-background/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Índice</CardTitle>
          </CardHeader>
          <CardContent>
            <nav>
              <ul className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto overscroll-contain">
                {availableSections.map(renderMainSection)}
              </ul>
            </nav>
          </CardContent>
        </Card>
      </div>
    </>
  );
}