import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useSearch } from "@/hooks/use-search";
import { SearchResults } from "@/components/SearchResults";
import { useTranslation } from "react-i18next";

const HeroSection = () => {
  const { t } = useTranslation(["common", "content"]);
  const [showResults, setShowResults] = useState(false);
  
  const {
    query,
    results,
    isLoading,
    error,
    hasSearched,
    hasResults,
    setQuery,
    search,
    clearSearch
  } = useSearch({
    threshold: 0.15,
    top: 10,
    debounceMs: 500
  });

  const suggestions = [
    "Vicente do Rego Monteiro",
    "Plínio Sussekind",
    "Alberto Betim",
    "Jean-Baptiste Debret",
    "Festival de Cannes"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowResults(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (!value.trim()) {
      setShowResults(false);
      clearSearch();
    } else {
      setShowResults(true);
    }
  };

  return (
    <section id="inicio" className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* New branding text above title */}
          <div className="text-red-500 text-2xl sm:text-3xl font-bold mb-4 italic">
            Trânsitos | Circulations
          </div>
          
          {/* Updated title with color styling */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            {t("content:hero.title")}
          </h1>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-darkyellow mb-6">
            {t("content:hero.period")}
          </div>

          {/* Hero Description */}
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            {t("content:hero.description")}
          </p>

          {/* Search Section */}
          <div className="max-w-4xl mx-auto mb-8">
            <div id="pesquisar" className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={t("common:search")}
                    value={query}
                    onChange={handleInputChange}
                    className="h-14 text-lg pl-6 pr-14 rounded-full border-2 focus:border-primary"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isLoading ? (
                      <Search className="h-5 w-5 text-muted-foreground animate-spin" />
                    ) : (
                      <Search className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Search Suggestions */}
              {!showResults && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">{t("common:searchSuggestions")}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1 text-sm bg-muted hover:bg-muted/70 text-foreground rounded-full transition-colors border border-border hover:border-primary/50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {showResults && (
              <div className="mt-8 max-w-4xl mx-auto">
                <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-xl p-4 md:p-6 shadow-xl">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-semibold text-foreground">{t("common:searchResults")}</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setShowResults(false);
                        clearSearch();
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {t("common:close")}
                    </Button>
                  </div>
                  
                  {results && (
                    <SearchResults
                      results={results}
                      query={query}
                      isLoading={isLoading}
                      onSubmissionClick={(id) => {
                        console.log('View submission:', id);
                        // Here you would navigate to the submission detail page
                      }}
                    />
                  )}

                  {error && (
                    <div className="text-center py-12">
                      <div className="text-destructive text-lg font-semibold mb-3">{t("common:searchError")}</div>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
                      <Button 
                        variant="outline" 
                        size="default"
                        className="mt-2"
                        onClick={() => setQuery(query)}
                      >
                        {t("common:searchRetry")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Scroll Indicator */}
          <div className="mt-16">
            <ChevronDown className="h-6 w-6 text-muted-foreground animate-bounce mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">{t("common:exploreCategories")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;