import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, Flag, Volume2, VolumeX } from "lucide-react";
import { DumpWithTimestamp, rateDump, reportDump } from "@/services/supabaseService"
import { useToast } from "@/hooks/use-toast";

interface DumpCardProps {
  dump: DumpWithTimestamp;
  className?: string;
}

const DumpCard = ({ dump, className = "" }: DumpCardProps) => {
  const [localUpvotes, setLocalUpvotes] = useState(dump.upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(dump.downvotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleVote = (voteType: 'up' | 'down') => {
    // Prevent rapid clicking
    if (userVote === voteType) {
      toast({
        title: "Already voted",
        description: `You already ${voteType === 'up' ? 'upvoted' : 'downvoted'} this dump`,
        duration: 2000,
      });
      return;
    }

    rateDump(dump.id, voteType).then((result) => {
      if (result.success) {
        setUserVote(voteType);
        // Update local state optimistically
        if (voteType === 'up') {
          setLocalUpvotes(prev => prev + 1);
        } else {
          setLocalDownvotes(prev => prev + 1);
        }
        
        toast({
          title: result.message,
          duration: 2000,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
          duration: 3000,
        });
      }
    }).catch((error) => {
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive",
        duration: 3000,
      });
    });
  };

  const handleReport = () => {
    reportDump(dump.id).then((result) => {
      toast({
        title: result.message,
        variant: result.success ? "default" : "destructive",
        duration: 3000,
      });
    });
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
          toast({
            title: "Error",
            description: "Failed to play audio",
            variant: "destructive",
            duration: 2000,
          });
        });
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-wrap gap-2">
            {dump.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="capitalize">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatTimestamp(dump.timestamp)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReport}
              className="p-1 h-auto text-muted-foreground hover:text-destructive"
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          {dump.type === 'text' && (
            <p className="text-lg leading-relaxed text-foreground">
              {dump.content}
            </p>
          )}
          
          {dump.type === 'image' && (
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <img 
                src={dump.content} 
                alt="User uploaded content"
                className="w-full h-auto max-h-96 object-contain bg-background"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                }}
              />
            </div>
          )}
          
          {dump.type === 'voice' && (
            <div className="bg-muted rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <Button
                  onClick={toggleAudio}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-3"
                >
                  {isPlaying ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                  {isPlaying ? 'Pause Audio' : 'Play Audio'}
                </Button>
              </div>
              <audio 
                ref={audioRef}
                src={dump.content} 
                controls 
                className="w-full"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error('Audio error:', e);
                  toast({
                    title: "Error",
                    description: "Failed to load audio",
                    variant: "destructive",
                    duration: 2000,
                  });
                }}
              />
            </div>
          )}
          
          {dump.type === 'video' && (
            <div className="relative">
              <video 
                src={dump.content} 
                controls 
                className="w-full h-auto rounded-lg max-h-96"
                onError={(e) => {
                  e.currentTarget.poster = 'https://via.placeholder.com/400x300?text=Video+Not+Found';
                }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote('up')}
              className="flex items-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              {localUpvotes}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote('down')}
              className="flex items-center gap-2"
            >
              <ThumbsDown className="w-4 h-4" />
              {localDownvotes}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Rating: {dump.rating.toFixed(1)}★
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DumpCard;