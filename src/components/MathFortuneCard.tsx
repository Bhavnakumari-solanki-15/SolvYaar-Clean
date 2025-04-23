import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { generateMathFortune, extractKeywords } from '@/lib/groq';
import { fetchImageForFortune } from '@/lib/imageFetch';
import { Award, Star } from 'lucide-react';

interface MathFortuneCardProps {
  userId: string | null;
  onGenerate: (fortune: string, imageUrl: string) => void;
  isGenerating?: boolean;
  fortuneText?: string;
  imageUrl?: string;
}

export function MathFortuneCard({
  userId,
  onGenerate,
  isGenerating = false,
  fortuneText,
  imageUrl,
}: MathFortuneCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fortune, setFortune] = useState<string | null>(fortuneText || null);
  const [fortuneTitle, setFortuneTitle] = useState<string | null>(null);
  const [fortuneFacts, setFortuneFacts] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(imageUrl || null);
  const [error, setError] = useState<string | null>(null);

  // Reset fortune when user changes
  useEffect(() => {
    if (!userId) {
      setFortune(null);
      setFortuneTitle(null);
      setFortuneFacts(null);
      setImage(null);
    }
  }, [userId]);

  const handleGenerateFortune = async () => {
    if (!userId || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate a fortune using Groq API
      const fortuneData = await generateMathFortune();
      const newFortune = fortuneData.fortune;
      
      setFortune(newFortune);
      setFortuneTitle(fortuneData.title);
      setFortuneFacts(fortuneData.facts);
      
      // Extract keywords from the fortune for image search
      const keywords = extractKeywords(newFortune);
      
      // Fetch an image based on the keywords
      const imageResult = await fetchImageForFortune(newFortune, keywords);
      setImage(imageResult.url);
      
      // Notify parent component about the generated fortune and image
      onGenerate(newFortune, imageResult.url);
    } catch (err) {
      console.error('Error generating fortune:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate your achievement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-slate-800 to-slate-900 border-purple-800 shadow-xl overflow-hidden">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-sans text-white flex items-center justify-center">
          <Award className="w-5 h-5 mr-2 text-yellow-400" /> Math Fortune
        </CardTitle>
        <CardDescription className="text-center text-purple-300 text-xs">
          See your mathematical fortune
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {!userId ? (
          <div className="text-center p-4 text-slate-400 text-sm">
            Connect your wallet to reveal your Fortune
          </div>
        ) : (
          <>
            {isLoading || isGenerating ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-lg bg-slate-700" />
                <Skeleton className="h-16 w-full rounded-lg bg-slate-700" />
              </div>
            ) : (
              <>
                {image && (
                  <div className="relative h-40 w-full overflow-hidden rounded-lg">
                    <img 
                      src={image} 
                      alt="Achievement"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    
                    {fortuneTitle && (
                      <div className="absolute bottom-0 w-full p-2 text-center">
                        <div className="flex items-center justify-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <p className="text-lg font-sans font-bold text-white">
                            {fortuneTitle}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {fortune && (
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-yellow-700/30 w-full">
                    <p className="text-white text-base font-sans text-center">
                      {fortune}
                    </p>
                    
                    {fortuneFacts && (
                      <div className="mt-3 pt-2 border-t border-purple-800/30">
                        <p className="text-slate-300 text-xs leading-snug">
                          {fortuneFacts}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {error && (
                  <div className="p-2 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-xs">
                    {error}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center py-3">
        <Button
          onClick={handleGenerateFortune}
          disabled={!userId || isLoading || isGenerating}
          className="w-full max-w-xs mx-auto bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-full text-sm"
        >
          {isLoading || isGenerating ? (
            <span className="flex items-center justify-center w-full">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Revealing Fortune...
            </span>
          ) : (
            <>Reveal Fortune</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 