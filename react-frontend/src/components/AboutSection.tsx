'use client';

import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSmoothScroll } from '@/hooks/use-smooth-scroll';
import { useTranslation } from 'react-i18next';

export default function AboutSection() {
  const { t } = useTranslation(["content", "common"]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { scrollToElement } = useSmoothScroll();
  const expandedContentRef = useRef<HTMLDivElement>(null);

  const isElementFullyVisible = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Check if the element's bottom is within the viewport with some margin
    return rect.bottom <= viewportHeight - 50; // 50px margin from bottom
  };

  const toggleExpansion = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      
      // Check if we need to scroll after content is rendered
      setTimeout(() => {
        const expandedContent = expandedContentRef.current;
        if (expandedContent && !isElementFullyVisible(expandedContent)) {
          scrollToElement('expanded-content', 100);
        }
      }, 200); // Wait for transition to start
    } else {
      setIsExpanded(false);
    }
  };

  return (
    <section id="sobre" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("content:about.title")}
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Preview text */}
          <div className="text-lg leading-relaxed text-center mb-8">
            <p>
              {t("content:about.intro")}
            </p>
          </div>

          {/* Expanded content */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div 
              ref={expandedContentRef}
              id="expanded-content" 
              className="text-lg leading-relaxed text-center mb-8 transform transition-transform duration-300 ease-in-out"
              style={{
                transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)'
              }}
            >
              <p>
                {t("content:about.expanded")}
              </p>
            </div>
          </div>

          {/* Toggle button */}
          <div className="text-center">
            <button
              onClick={toggleExpansion}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              {isExpanded ? (
                <>
                  {t("common:readLess")}
                  <ChevronUp className="w-5 h-5" />
                </>
              ) : (
                <>
                  {t("common:readMore")}
                  <ChevronDown className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}