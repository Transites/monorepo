import Header from "@/components/Header.tsx";
import HeroSection from "@/components/HeroSection.tsx";
import CategoriesSection from "@/components/CategoriesSection.tsx";
import AboutSection from "@/components/AboutSection.tsx";
import MediaSection from "@/components/MediaSection.tsx";
import Footer from "@/components/Footer.tsx";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CategoriesSection />
        <AboutSection />
        <MediaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
