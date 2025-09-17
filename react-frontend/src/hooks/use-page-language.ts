import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

// Key for storing homepage language preference
const HOMEPAGE_LANGUAGE_KEY = 'homepage-language-preference';

export function usePageLanguage() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const previousPathnameRef = useRef<string>('');
  const isRestoringRef = useRef<boolean>(false);
  
  // Check if we're on the homepage
  const isHomepage = location.pathname === '/';
  
  // Store homepage language preference
  const storeHomepageLanguage = (language: string) => {
    localStorage.setItem(HOMEPAGE_LANGUAGE_KEY, language);
  };
  
  // Get stored homepage language preference
  const getHomepageLanguage = (): string => {
    return localStorage.getItem(HOMEPAGE_LANGUAGE_KEY) || 'pt-BR';
  };
  
  // Handle language changes based on page context
  const handleLanguageChange = (newLanguage: string) => {
    if (isHomepage) {
      // On homepage: change language and store preference
      storeHomepageLanguage(newLanguage);
      i18n.changeLanguage(newLanguage);
    }
    // On other pages: do nothing (locked to pt-BR)
  };
  
  // Restore language preference for homepage
  const restoreHomepageLanguage = useCallback(() => {
    if (!isHomepage || isRestoringRef.current) {
      return;
    }
    
    const savedLanguage = getHomepageLanguage();
    
    if (i18n.language !== savedLanguage) {
      isRestoringRef.current = true;
      
      // Force language change and wait for it to complete
      i18n.changeLanguage(savedLanguage).finally(() => {
        isRestoringRef.current = false;
      });
    }
  }, [isHomepage, i18n, getHomepageLanguage]);

  // Effect to manage language based on page navigation
  useEffect(() => {
    const currentPathname = location.pathname;
    const previousPathname = previousPathnameRef.current;
    
    // Update the ref for next navigation
    previousPathnameRef.current = currentPathname;
    
    // Skip if same path (shouldn't happen, but safety check)
    if (previousPathname === currentPathname && previousPathname !== '') {
      return;
    }
    
    if (isHomepage) {
      // Use a longer delay to ensure all navigation effects are complete
      const timer = setTimeout(() => {
        restoreHomepageLanguage();
      }, 200); // Delay to handle Header navigation timing
      
      return () => clearTimeout(timer);
    } else {
      // Lock to Portuguese for non-homepage pages
      if (i18n.language !== 'pt-BR') {
        i18n.changeLanguage('pt-BR');
      }
    }
  }, [location.pathname, isHomepage, restoreHomepageLanguage, i18n]);
  
  return {
    isHomepage,
    currentLanguage: i18n.language,
    isLocked: !isHomepage,
    changeLanguage: handleLanguageChange,
    getHomepageLanguage,
  };
}