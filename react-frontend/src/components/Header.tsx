import { Menu, LogOut, User as UserIcon, LockOpen } from "lucide-react"; // Added icons
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "./LanguageToggle";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { scrollToElement } = useSmoothScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation(["navigation", "common"]);
  
  // Destructure auth state and methods
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, elementId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        scrollToElement(elementId, 80);
      }, 100);
    } else {
      scrollToElement(elementId, 80);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); // Go home after logging out
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" onClick={handleLogoClick} className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src="/uploads/016cd4f1-53a9-4afa-bf7f-015c51ec76f6.png"
              alt="Trânsitos Logo" 
              className="h-8 w-8 mr-3"
            />
            <h1 className="text-2xl font-bold text-primary">Trânsitos | <span className="italic">Circulations</span></h1>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-4 whitespace-nowrap">
            <a href="#inicio" onClick={(e) => handleNavClick(e, 'inicio')} className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer whitespace-nowrap">{t('navigation:home')}</a>
            <a href="#pesquisar" onClick={(e) => handleNavClick(e, 'pesquisar')} className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer whitespace-nowrap">{t('navigation:search')}</a>
            <a href="#sobre" onClick={(e) => handleNavClick(e, 'sobre')} className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer whitespace-nowrap">{t('navigation:about')}</a>
            <a href="#contato" onClick={(e) => handleNavClick(e, 'contato')} className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer whitespace-nowrap">{t('navigation:contact')}</a>
            {isAuthenticated && ( 
              <>
              <Link to="/minhas-submissoes" className="text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">{t('navigation:myArticles')}</Link> 
              <Link to="/submissao/nova" className="text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">{t('navigation:submit')}</Link> 
              </>
            )} 
            {isAdmin && (
              <Link to="/admin/home">
                <Button size="sm" className="bg-black text-white hover:bg-black/90 whitespace-nowrap">
                  <LockOpen className="h-4 w-4" />
                  {t('navigation:admin')}
                </Button>
              </Link>
            )}

            <div className="h-6 w-px bg-border mx-1 shrink-0" /> {/* Vertical Divider */}

            {/* 2. Conditional Rendering for Desktop Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 whitespace-nowrap">
                <div className="flex items-center text-sm font-medium text-muted-foreground whitespace-nowrap">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span className="max-w-[150px] truncate">{user?.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10 whitespace-nowrap">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('navigation:logout')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 whitespace-nowrap">
                <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
                  {t('navigation:login')}
                </Link>
                <Link to="/registro">
                  <Button size="sm" className="whitespace-nowrap">{t('navigation:register')}</Button>
                </Link>
              </div>
            )}
            
            <div className="shrink-0"><LanguageToggle /></div>
          </nav>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-3/4 sm:max-w-sm">
              <nav className="flex flex-col space-y-6 mt-8">
                <a href="#inicio" onClick={(e) => handleNavClick(e, 'inicio')} className="text-lg font-medium">{t('navigation:home')}</a>
                <a href="#pesquisar" onClick={(e) => handleNavClick(e, 'pesquisar')} className="text-lg font-medium">{t('navigation:search')}</a>
                <a href="#sobre" onClick={(e) => handleNavClick(e, 'sobre')} className="text-lg font-medium">{t('navigation:about')}</a>
                <a href="#contato" onClick={(e) => handleNavClick(e, 'contato')} className="text-lg font-medium">{t('navigation:contact')}</a>
                {isAuthenticated && (
                  <> 
                    <Link to="/minhas-submissoes" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">{t('navigation:myArticles')}</Link>
                    <Link to="/submissao/nova" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">{t('navigation:submit')}</Link>
                  </>
                )} 
                {isAdmin && (
                  <Link to="/admin/home" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-start bg-black text-white hover:bg-black/90">
                      <LockOpen className="h-4 w-4" />
                      {t('navigation:adminArea')}
                    </Button>
                  </Link>
                )}


                {/* 3. Conditional Rendering for Mobile Auth */}
                <div className="border-t pt-6 flex flex-col space-y-4">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center text-sm font-medium text-primary">
                        <UserIcon className="h-5 w-5 mr-2" />
                        {user?.email}
                      </div>
                      <Button variant="outline" onClick={handleLogout} className="justify-start">
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('navigation:logout')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">{t('navigation:login')}</Link>
                      <Link to="/registro" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">{t('navigation:register')}</Link>
                    </>
                  )}
                </div>

                <div className="border-t pt-6">
                  <LanguageToggle />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;