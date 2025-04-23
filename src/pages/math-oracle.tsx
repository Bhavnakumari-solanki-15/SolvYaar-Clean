import { useState, useEffect } from 'react';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { MathFortuneCard } from '@/components/MathFortuneCard';
import { MintScrollButton } from '@/components/MintScrollButton';
import { MyScrollsGallery } from '@/components/MyScrollsGallery';
import { setGroqApiKey } from '@/lib/groq';
import { setUnsplashAccessKey, setImgFlipCredentials } from '@/lib/imageFetch';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport, toast } from '@/components/ui/toast';
import BackgroundFX from '@/components/BackgroundFX';
import { useTheme } from '@/components/theme-provider';

export default function MathOraclePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [fortune, setFortune] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [lastMintedId, setLastMintedId] = useState<string | null>(null);
  const [apiKeysSet, setApiKeysSet] = useState(false);
  const { resolvedTheme } = useTheme();
  
  // Initialize API keys
  useEffect(() => {
    // Initialize API keys from environment variables
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    const IMGFLIP_USERNAME = import.meta.env.VITE_IMGFLIP_USERNAME;
    const IMGFLIP_PASSWORD = import.meta.env.VITE_IMGFLIP_PASSWORD;
    
    if (GROQ_API_KEY) setGroqApiKey(GROQ_API_KEY);
    if (UNSPLASH_ACCESS_KEY) setUnsplashAccessKey(UNSPLASH_ACCESS_KEY);
    if (IMGFLIP_USERNAME && IMGFLIP_PASSWORD) setImgFlipCredentials(IMGFLIP_USERNAME, IMGFLIP_PASSWORD);
    
    // Check if key API keys are set
    const keysSet = Boolean(GROQ_API_KEY && UNSPLASH_ACCESS_KEY);
    setApiKeysSet(keysSet);
    
    if (!keysSet) {
      console.warn('Warning: Some API keys are missing. The app may not function correctly.');
    }
  }, []);
  
  // Handle wallet connection
  const handleWalletConnect = (address: string) => {
    setUserId(address);
  };
  
  // Handle fortune generation
  const handleFortuneGenerate = (fortune: string, image: string) => {
    setFortune(fortune);
    setImageUrl(image);
  };
  
  // Handle successful NFT mint
  const handleMintSuccess = (scroll: any) => {
    // Extract tokenId and scrollId from the scroll object
    const tokenId = scroll.tx_hash || "unknown";
    const scrollId = scroll.id || "unknown";
    
    setLastMintedId(scrollId);
    
    // Show success message
    toast({
      title: "Math Scroll Minted!",
      description: `Successfully minted scroll with token #${tokenId}`,
      duration: 5000,
    });
    
    // Reset fortune to encourage creating a new one
    setFortune(null);
    setImageUrl(null);
  };
  
  // Dynamic classes based on theme
  const bgClasses = resolvedTheme === 'dark' 
    ? "min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 text-white"
    : "min-h-screen bg-gradient-to-b from-slate-50 via-purple-50 to-slate-100 text-slate-900";
    
  const headerClasses = resolvedTheme === 'dark'
    ? "sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-purple-900/30"
    : "sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-purple-200/50 shadow-sm";
    
  const heroClasses = resolvedTheme === 'dark'
    ? "py-16 px-4 bg-gradient-to-b from-purple-900/20 to-transparent"
    : "py-16 px-4 bg-gradient-to-b from-purple-100/50 to-transparent";
    
  const scrollsAreaClasses = resolvedTheme === 'dark'
    ? "bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-purple-800/30 p-6 shadow-xl h-full"
    : "bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200 p-6 shadow-lg h-full";
    
  const titleGradient = resolvedTheme === 'dark'
    ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
    : "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600";
    
  const scrollsTitleGradient = resolvedTheme === 'dark'
    ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300"
    : "text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600";
    
  const footerClasses = resolvedTheme === 'dark'
    ? "text-slate-400 border-t border-purple-900/20"
    : "text-slate-500 border-t border-purple-200/30";
  
  const warningClasses = resolvedTheme === 'dark'
    ? "bg-yellow-900/40 border border-yellow-800 text-yellow-400"
    : "bg-yellow-100 border border-yellow-300 text-yellow-800";
  
  return (
    <ToastProvider>
      <div className={bgClasses}>
        {/* Add the birds background */}
        <BackgroundFX />
        
        {/* Fixed header with wallet connect button aligned right */}
        <header className={headerClasses}>
          <div className="container mx-auto py-4 px-6">
            <div className="flex justify-between items-center">
              <h1 className={`text-2xl font-bold ${titleGradient}`}>
                🔮 Math Oracle
              </h1>
              <WalletConnectButton onConnect={handleWalletConnect} className="ml-auto" />
            </div>
          </div>
        </header>
        
        {/* Hero section with main title and description */}
        <section className={heroClasses}>
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className={`text-5xl md:text-6xl font-bold mb-6 ${titleGradient} animate-text-shimmer`}>
              Mathematical Divination
            </h2>
            <p className={resolvedTheme === 'dark' ? "text-xl text-purple-300 max-w-2xl mx-auto leading-relaxed" : "text-xl text-purple-700 max-w-2xl mx-auto leading-relaxed"}>
              Connect your wallet to the Monad testnet, receive a mathematical fortune 
              powered by AI, and mint it as an NFT on the blockchain.
            </p>
          </div>
        </section>
        
        <main className="container mx-auto px-4 py-8 relative z-10">
          {!apiKeysSet && (
            <div className={`${warningClasses} p-4 rounded-lg mb-8 max-w-3xl mx-auto`}>
              <p className="font-medium">⚠️ API Keys Missing</p>
              <p className="text-sm mt-1">
                Some API keys are not configured. Please set the required environment variables
                for full functionality.
              </p>
            </div>
          )}
          
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Main fortune card area */}
            <div className="md:col-span-7 flex flex-col items-center">
              <MathFortuneCard 
                userId={userId} 
                onGenerate={handleFortuneGenerate}
                fortuneText={fortune || undefined}
                imageUrl={imageUrl || undefined}
              />
              
              {fortune && imageUrl && userId && (
                <div className="mt-6 w-full max-w-md">
                  <MintScrollButton
                    walletAddress={userId}
                    fortune={fortune}
                    imageUrl={imageUrl}
                    onSuccess={handleMintSuccess}
                  />
                </div>
              )}
            </div>
            
            {/* Scroll collection area */}
            <div className="md:col-span-5">
              <div className={scrollsAreaClasses}>
                <h3 className={`text-2xl font-bold mb-4 text-center ${scrollsTitleGradient}`}>
                  Your Math Scrolls
                </h3>
                <div className="h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-700 scrollbar-track-slate-800/20">
                  <MyScrollsGallery 
                    walletAddress={userId}
                    newMintId={lastMintedId || undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <footer className={`container mx-auto px-4 py-8 text-center text-sm relative z-10 ${footerClasses} mt-12`}>
          <p>
            Powered by Monad Blockchain, Groq AI, and Supabase
          </p>
          <p className="mt-1">
            Math Oracle NFTs are minted on the Monad testnet and have no real-world value.
          </p>
        </footer>
      </div>
      
      {/* Adding animation CSS as a style element in the head */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes blob {
          0% { transform: scale(1); }
          33% { transform: scale(1.1); }
          66% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes text-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-text-shimmer {
          background-size: 200% auto;
          animation: text-shimmer 3s linear infinite;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: ${resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.2)' : 'rgba(243, 244, 246, 0.5)'};
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: ${resolvedTheme === 'dark' ? 'rgba(147, 51, 234, 0.5)' : 'rgba(147, 51, 234, 0.3)'};
          border-radius: 10px;
        }
      `}} />
      
      <ToastViewport />
    </ToastProvider>
  );
} 