import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-8 text-center">
        {/* Logo with subtle animation */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping"></div>
          <div className="relative w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center">
            <img 
              src="/favicon.ico" 
              alt="Transitos" 
              className="w-16 h-16 animate-pulse"
            />
          </div>
        </div>
        
        {/* Loading spinner and text */}
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" className="w-12 h-12" />
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Carregando...
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Preparando a melhor experiência para você
            </p>
          </div>
        </div>
        
        {/* Subtle progress indicator */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{
            width: '100%',
            animation: 'loading-progress 2s ease-in-out infinite'
          }}></div>
        </div>
      </div>
      
      {/* Custom animation keyframes */}
      <style>{`
        @keyframes loading-progress {
          0%, 100% { width: 20%; }
          50% { width: 80%; }
        }
      `}</style>
    </div>
  )
}