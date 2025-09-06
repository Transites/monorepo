'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getCategoryColor } from '@/lib/categoryColors';
import { useSmoothScroll } from '@/hooks/use-smooth-scroll';

export default function AboutSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { scrollToElement } = useSmoothScroll();

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
    
    // Scroll to expanded content if expanding, accounting for navbar
    if (!isExpanded) {
      setTimeout(() => {
        scrollToElement('expanded-content', 100); // 100px offset for navbar + padding
      }, 100);
    }
  };

  return (
    <section id="sobre" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Sobre o Projeto Trânsitos
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Preview text */}
          <div className="text-lg leading-relaxed text-center mb-8">
            <p>
              Trânsitos|Circulations é uma enciclopédia digital, interativa e bilíngue que se destina a mapear, sistematizar e
              fomentar pesquisas sobre as relações franco-brasileiras, com enfoque em{' '}
              <span className={`text-${getCategoryColor('pessoas')} font-semibold`}>pessoas</span>,{' '}
              <span className={`text-${getCategoryColor('obras')} font-semibold`}>obras</span>,{' '}
              <span className={`text-${getCategoryColor('instituições')} font-semibold`}>instituições</span>,{' '}
              <span className={`text-${getCategoryColor('empresas')} font-semibold`}>empresas</span>,{' '}
              <span className={`text-${getCategoryColor('agrupamentos')} font-semibold`}>agrupamentos</span>,{' '}
              <span className={`text-${getCategoryColor('eventos')} font-semibold`}>eventos</span> e{' '}
              <span className={`text-${getCategoryColor('conceitos')} font-semibold`}>conceitos</span>, no período de 1880 a 1990.
            </p>
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div id="expanded-content" className="text-lg leading-relaxed text-center mb-8">
              <p>
                Pessoas, grupos e obras circularam nos dois sentidos do Atlântico. São os trânsitos que buscamos recuperar e os
                movimentos que entendemos redesenhar, em diferentes esferas
                da sociedade, desde as cooperações intelectuais, científicas e artísticas até, ou principalmente, as migrações
                motivadas por questões econômicas, políticas ou religiosas. A Enciclopédia tem duplo propósito: a) desenvolver
                trabalhos inéditos, a partir de uma abordagem transdisciplinar; b) refletir sobre os usos da tecnologia para a
                pesquisa, mas também desenvolver ferramentas próprias que potencializam as bases de dados e a interação com os
                leitores.
              </p>
            </div>
          )}

          {/* Toggle button */}
          <div className="text-center">
            <button
              onClick={toggleExpansion}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              {isExpanded ? (
                <>
                  Mostrar menos
                  <ChevronUp className="w-5 h-5" />
                </>
              ) : (
                <>
                  Saiba mais sobre o projeto
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