import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getMathScrolls, MathScroll } from '@/lib/supabase';
import { ChevronsDown, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MyScrollsGalleryProps {
  walletAddress: string | null;
  newMintId?: string;
}

export function MyScrollsGallery({ walletAddress, newMintId }: MyScrollsGalleryProps) {
  const [scrolls, setScrolls] = useState<MathScroll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScroll, setSelectedScroll] = useState<MathScroll | null>(null);

  // Fetch user's scrolls from Supabase
  const fetchScrolls = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userScrolls = await getMathScrolls(walletAddress);
      setScrolls(userScrolls);
    } catch (err) {
      console.error('Error fetching scrolls:', err);
      setError(err instanceof Error ? err.message : 'Failed to load your scrolls');
    } finally {
      setIsLoading(false);
    }
  };

  // Load scrolls on initial render and when wallet changes
  useEffect(() => {
    if (walletAddress) {
      fetchScrolls();
    } else {
      setScrolls([]);
    }
  }, [walletAddress]);

  // Reload scrolls when a new mint occurs
  useEffect(() => {
    if (newMintId && walletAddress) {
      fetchScrolls();
      
      // Auto-open the newly minted scroll
      setTimeout(() => {
        const newScroll = scrolls.find(s => s.id === newMintId);
        if (newScroll) {
          setSelectedScroll(newScroll);
        }
      }, 500); // Small delay to ensure scrolls are loaded
    }
  }, [newMintId, scrolls]);

  // Open scroll detail modal
  const openScrollDetail = (scroll: MathScroll) => {
    setSelectedScroll(scroll);
  };

  // Close scroll detail modal
  const closeScrollDetail = () => {
    setSelectedScroll(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!walletAddress) {
    return null;
  }

  return (
    <div className="mt-8">
      <Card className="w-full bg-gradient-to-br from-slate-800 to-slate-900 border-purple-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center">
            <span className="mr-2">📜</span> My Math Scrolls
          </CardTitle>
          <CardDescription className="text-purple-300">
            Your collection of minted math solutions
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-lg bg-slate-700" />
              <Skeleton className="h-40 w-full rounded-lg bg-slate-700" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
              {error}
            </div>
          ) : scrolls.length === 0 ? (
            <div className="text-center p-8 text-slate-400">
              <p>You haven't minted any math scrolls yet.</p>
              <p className="mt-2 text-sm">Solve a problem and mint it to see it here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scrolls.map((scroll) => (
                <Card 
                  key={scroll.id} 
                  className="bg-slate-800 border-purple-700/30 hover:shadow-md transition-shadow duration-300 cursor-pointer"
                  onClick={() => openScrollDetail(scroll)}
                >
                  <div className="relative">
                    {scroll.image_url && (
                      <div className="rounded-t-lg overflow-hidden">
                        <img 
                          src={scroll.image_url} 
                          alt="Scroll Background" 
                          className="w-full h-36 object-cover"
                        />
                        
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                          <span className="text-white font-medium text-sm bg-purple-600/70 px-3 py-1 rounded-full flex items-center">
                            <ChevronsDown className="w-4 h-4 mr-1" /> View Scroll
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="text-white text-sm font-medium truncate">{scroll.problem}</h3>
                      <p className="text-slate-400 text-xs mt-1">{formatDate(scroll.timestamp)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {scrolls.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Button 
                variant="outline"
                size="sm"
                onClick={fetchScrolls}
                className="text-purple-300 border-purple-700 hover:bg-purple-900/30"
              >
                Refresh Scrolls
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scroll Detail Modal */}
      <Dialog open={selectedScroll !== null} onOpenChange={(open) => !open && closeScrollDetail()}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-purple-950 border-purple-700 text-white max-w-2xl w-full p-0 overflow-hidden">
          {selectedScroll && (
            <>
              <div className="relative w-full h-48 overflow-hidden">
                {selectedScroll.image_url && (
                  <img 
                    src={selectedScroll.image_url} 
                    alt="Scroll Background" 
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90"></div>
                <Button 
                  className="absolute top-2 right-2 rounded-full w-8 h-8 p-0 bg-black/40 hover:bg-black/60 text-white"
                  variant="ghost"
                  onClick={closeScrollDetail}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-6 -mt-16 relative z-10">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                    Mathematical Fortune
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-800/30">
                    <h3 className="text-purple-300 text-sm font-medium mb-2">Question:</h3>
                    <p className="text-white text-base">{selectedScroll.problem}</p>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-800/30">
                    <h3 className="text-purple-300 text-sm font-medium mb-2">Solution:</h3>
                    <p className="text-white text-base font-mono">{selectedScroll.solution}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-purple-800/30">
                    <div className="text-sm text-purple-300">
                      Minted: {formatDate(selectedScroll.timestamp)}
                    </div>
                    <a
                      href={`https://testnet.monadexplorer.com/tx/${selectedScroll.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-purple-300 hover:text-purple-200 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View on Blockchain <ExternalLink className="ml-1 w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 