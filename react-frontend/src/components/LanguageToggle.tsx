import React from "react";
import { usePageLanguage } from "@/hooks/use-page-language";

export function LanguageToggle() {
  const { currentLanguage, isLocked, changeLanguage } = usePageLanguage();
  
  const isPortuguese = currentLanguage === "pt-BR";
  
  const handleLanguageToggle = () => {
    if (isLocked) return; // Don't allow changes on locked pages
    
    const newLanguage = isPortuguese ? "fr-FR" : "pt-BR";
    changeLanguage(newLanguage);
  };

  const getTooltipText = () => {
    if (isLocked) {
      return "Language selection available only on homepage";
    }
    return `Switch to ${isPortuguese ? 'Français' : 'Português'}`;
  };

  return (
    <button
      onClick={handleLanguageToggle}
      className={`relative inline-flex items-center rounded-full p-1 transition-all duration-300 ease-in-out shadow-sm border ${
        isLocked 
          ? "bg-muted/40 border-border/30 cursor-not-allowed opacity-75" 
          : "bg-muted/80 hover:bg-muted border-border/50 hover:border-border cursor-pointer"
      }`}
      style={{ width: "80px", height: "36px" }}
      title={getTooltipText()}
    >
      {/* Background pill */}
      <div className="absolute inset-0 rounded-full bg-muted/50" />
      
      {/* Animated highlight circle */}
      <div 
        className={`absolute top-1 bottom-1 w-8 rounded-full shadow-md border transition-all duration-300 ease-in-out ${
          isLocked 
            ? "bg-muted border-border/20" 
            : "bg-background border-border/30"
        }`}
        style={{
          left: isPortuguese ? "4px" : "44px",
          transform: "translateX(0)"
        }}
      />
      
      {/* Lock icon overlay for locked state */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <span className="text-xs text-muted-foreground/60">🔒</span>
        </div>
      )}
      
      {/* Portugal/Brazil flag */}
      <div className="relative z-10 flex items-center justify-center w-8 h-8 ml-1">
        <span 
          className={`text-lg transition-all duration-300 ${
            isPortuguese 
              ? "opacity-100" 
              : isLocked 
                ? "opacity-30 grayscale" 
                : "opacity-60 grayscale"
          }`}
        >
          🇧🇷
        </span>
      </div>
      
      {/* France flag */}
      <div className="relative z-10 flex items-center justify-center w-8 h-8 ml-2">
        <span 
          className={`text-lg transition-all duration-300 ${
            !isPortuguese 
              ? "opacity-100" 
              : isLocked 
                ? "opacity-30 grayscale" 
                : "opacity-60 grayscale"
          }`}
        >
          🇫🇷
        </span>
      </div>
    </button>
  );
}