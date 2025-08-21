import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getRandomDump, type DumpWithTimestamp } from "@/services/supabaseService";
import DumpCard from "@/components/DumpCard";
import UploadForm from "@/components/UploadForm";
import { Shuffle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HeroSection = () => {
  const [currentDump, setCurrentDump] = useState<DumpWithTimestamp | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'dump' | 'upload'>('dump');
  const [key, setKey] = useState(0); // For re-triggering animations
  const [cacheWarmed, setCacheWarmed] = useState(false);
  const { toast } = useToast();

  // Preload cache on component mount for faster subsequent requests
  useEffect(() => {
    const warmCache = async () => {
      try {
        // Silently fetch a random dump to warm the cache
        await getRandomDump();
        setCacheWarmed(true);
      } catch (error) {
        console.log('Cache warming failed:', error);
        // Not critical, user experience will still work
      }
    };

    if (!cacheWarmed) {
      warmCache();
    }
  }, [cacheWarmed]);

  const handleGetRandomDump = async () => {
    setModalType('dump');
    setModalOpen(true);
    setIsLoading(true);
    
    try {
      const dump = await getRandomDump();
      setCurrentDump(dump);
      setKey(prev => prev + 1); // Trigger re-animation
    } catch (error) {
      console.error('Failed to fetch random dump:', error);
      toast({
        title: "Oops!",
        description: "Failed to fetch a dump. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
    
    setIsLoading(false);
  };

  const handleShowUploadForm = () => {
    setModalType('upload');
    setModalOpen(true);
    setCurrentDump(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentDump(null);
    setIsLoading(false);
  };

  const handleUploadSuccess = () => {
    setModalOpen(false);
    // Optionally show a success message or fetch a new dump
    toast({
      title: "Success!",
      description: "Your dump has been submitted successfully!",
      duration: 4000,
    });
  };

  return (
    <>
      <section className="min-h-screen bg-gradient-hero flex items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 pt-24 pb-12 relative z-10">
        <div className="text-center">
            {/* Large Brand Typography */}
            <div className="mb-8">
              <div className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-none tracking-tight mb-4 relative">
                <span className="bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent animate-pulse">
                  DUMPPP
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent opacity-20 blur-sm">
                  DUMPPP
                </div>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-8 leading-tight max-w-3xl mx-auto">
              Anonymous thoughts, feelings & random dumps from real people
            </h1>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 relative z-50">
              <Button 
                onClick={handleGetRandomDump}
                variant="cta" 
                size="lg" 
                className="text-xl px-12 py-6 h-auto rounded-full flex items-center gap-3 pointer-events-auto"
              >
                <Shuffle className="w-6 h-6" />
                Give me a dump!
              </Button>
              
              <Button
                onClick={handleShowUploadForm}
                variant="secondary"
                size="lg"
                className="text-xl px-12 py-6 h-auto rounded-full bg-white/20 text-white border border-white/30 hover:bg-white/30 flex items-center gap-3 pointer-events-auto relative z-50"
                style={{
                  minHeight: "60px", // Ensure proper button size
                  cursor: "pointer"
                }}
              >
                <Plus className="w-6 h-6" />
                Submit a Dump
              </Button>
            </div>

            {/* Welcome Message */}
              <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-white/80">
                <p className="text-lg mb-4">
                  Welcome to DumpSpace - where real people share their unfiltered thoughts
                </p>
                <p className="text-base">
                  Click "Give me a dump!" to see a random anonymous post, or submit your own!
                </p>
              </div>

            {/* Stats */}
            <div className="mt-16 text-center">
              <div className="text-4xl md:text-5xl font-black text-white/90 mb-2">
                10,000+
              </div>
              <div className="text-lg text-white/80">
                anonymous dumps shared
              </div>
            </div>
          </div>
      </div>

      {/* Cool Graphics Section */}
        <div className="relative py-24 overflow-hidden">
          {/* Animated Background Elements - Lower z-index */}
          {/* <div className="absolute inset-0 z-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-accent/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
            <div className="absolute top-32 right-20 w-24 h-24 bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
            <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-primary/10 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
            <div className="absolute bottom-32 right-1/3 w-28 h-28 bg-accent/15 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}></div>
          </div> */}

          {/* Main Graphics Content */}
          <div className="container mx-auto px-6 relative z-10">
            {/* <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            </div> */}

            {/* Floating Elements */}
            {/* <div className="mt-16 relative">
              <div className="absolute left-1/4 top-0 w-2 h-2 bg-accent rounded-full animate-ping"></div>
              <div className="absolute right-1/3 top-8 w-3 h-3 bg-white/50 rounded-full animate-pulse"></div>
              <div className="absolute left-1/2 bottom-0 w-1 h-1 bg-primary rounded-full animate-bounce"></div>
            </div> */}
          </div>
        </div>
    </section>

      {/* Modal Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {modalType === 'dump' ? 'Random Dump' : 'Submit Your Dump'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {modalType === 'dump' ? (
              <div>
                {/* Loading State */}
                {isLoading && (
                  <div className="text-center py-12">
                    <div className="animate-pulse">
                      <div className="flex justify-center mb-4">
                        <div className="w-8 h-8 bg-primary/20 rounded-full animate-bounce"></div>
                        <div className="w-8 h-8 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-8 h-8 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <p className="text-lg">
                        {cacheWarmed ? 'Finding the perfect dump for you...' : 'Loading dumps...'}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Current Dump Display */}
                {currentDump && !isLoading && (
                  <div key={key} className="animate-fade-in">
                    <DumpCard dump={currentDump} />
                    <div className="mt-6 text-center">
                      <Button 
                        onClick={handleGetRandomDump}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Shuffle className="w-4 h-4" />
                        Get Another Dump
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <p className="text-muted-foreground text-lg">
                    Completely anonymous. No judgments. Just pure, unfiltered expression.
                  </p>
                </div>
                <UploadForm onSuccess={handleUploadSuccess} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HeroSection;