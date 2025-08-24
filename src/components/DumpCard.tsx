"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown, Flag, Volume2, VolumeX, Shuffle, MessageCircle, ArrowLeft } from "lucide-react"
import { type DumpWithTimestamp, rateDump, reportDump } from "@/services/supabaseService"
import { useToast } from "@/hooks/use-toast"
import CommentsSection from "@/components/CommentsSection"

interface DumpCardProps {
  dump: DumpWithTimestamp
  className?: string
  showGetAnotherButton?: boolean
  onGetAnother?: () => void
  hideCommentsButton?: boolean
}

const DumpCard = ({
  dump,
  className = "",
  showGetAnotherButton = false,
  onGetAnother,
  hideCommentsButton = false,
}: DumpCardProps) => {
  const [localUpvotes, setLocalUpvotes] = useState(dump.upvotes)
  const [localDownvotes, setLocalDownvotes] = useState(dump.downvotes)
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()

  // Preload media content
  useEffect(() => {
    if (dump.type === "image" || dump.type === "video" || dump.type === "voice") {
      const preloadMedia = () => {
        if (dump.type === "image") {
          const img = new Image()
          img.onload = () => setMediaLoaded(true)
          img.onerror = () => setMediaLoaded(true) // Still set loaded to show fallback
          img.src = dump.content
        } else if (dump.type === "video") {
          const video = document.createElement("video")
          video.onloadeddata = () => setMediaLoaded(true)
          video.onerror = () => setMediaLoaded(true)
          video.preload = "metadata"
          video.src = dump.content
        } else if (dump.type === "voice") {
          const audio = new Audio()
          audio.onloadeddata = () => setMediaLoaded(true)
          audio.onerror = () => setMediaLoaded(true)
          audio.preload = "metadata"
          audio.src = dump.content
        }
      }

      preloadMedia()
    } else {
      setMediaLoaded(true) // Text content is always "loaded"
    }
  }, [dump.content, dump.type])

  const handleVote = (voteType: "up" | "down") => {
    // Prevent rapid clicking
    if (userVote === voteType) {
      toast({
        title: "Already voted",
        description: `You already ${voteType === "up" ? "upvoted" : "downvoted"} this dump`,
        duration: 2000,
      })
      return
    }

    rateDump(dump.id, voteType)
      .then((result) => {
        if (result.success) {
          setUserVote(voteType)
          // Update local state optimistically
          if (voteType === "up") {
            setLocalUpvotes((prev) => prev + 1)
          } else {
            setLocalDownvotes((prev) => prev + 1)
          }

          toast({
            title: result.message,
            duration: 2000,
          })
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
            duration: 3000,
          })
        }
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to submit vote",
          variant: "destructive",
          duration: 3000,
        })
      })
  }

  const handleReport = () => {
    reportDump(dump.id).then((result) => {
      toast({
        title: result.message,
        variant: result.success ? "default" : "destructive",
        duration: 3000,
      })
    })
  }

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error)
          toast({
            title: "Error",
            description: "Failed to play audio",
            variant: "destructive",
            duration: 2000,
          })
        })
      }
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  // Loading skeleton for media
  const MediaSkeleton = () => (
    <div className="bg-muted rounded-lg overflow-hidden animate-pulse">
      <div className="w-full h-64 bg-muted-foreground/20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    </div>
  )

  return (
    <Card
      className={`w-full max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in ${className}`}
    >
      <CardContent className="p-6">
        {!showComments && (
          <>
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
              {dump.type === "text" && <p className="text-lg leading-relaxed text-foreground">{dump.content}</p>}

              {dump.type === "image" && (
                <div className="relative bg-muted rounded-lg overflow-hidden">
                  {!mediaLoaded ? (
                    <MediaSkeleton />
                  ) : (
                    <img
                      ref={imageRef}
                      src={dump.content || "/placeholder.svg"}
                      alt="User uploaded content"
                      className="w-full h-auto max-h-96 object-contain bg-background"
                      loading="eager"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/400x300?text=Image+Not+Found"
                      }}
                    />
                  )}
                </div>
              )}

              {dump.type === "voice" && (
                <div className="bg-muted rounded-lg p-6">
                  {!mediaLoaded ? (
                    <MediaSkeleton />
                  ) : (
                    <>
                      <div className="flex items-center justify-center mb-4">
                        <Button
                          onClick={toggleAudio}
                          variant="outline"
                          size="lg"
                          className="flex items-center gap-3 bg-transparent"
                        >
                          {isPlaying ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                          {isPlaying ? "Pause Audio" : "Play Audio"}
                        </Button>
                      </div>
                      <audio
                        ref={audioRef}
                        src={dump.content}
                        controls
                        className="w-full"
                        preload="metadata"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        onError={(e) => {
                          console.error("Audio error:", e)
                          toast({
                            title: "Error",
                            description: "Failed to load audio",
                            variant: "destructive",
                            duration: 2000,
                          })
                        }}
                      />
                    </>
                  )}
                </div>
              )}

              {dump.type === "video" && (
                <div className="relative">
                  {!mediaLoaded ? (
                    <MediaSkeleton />
                  ) : (
                    <video
                      ref={videoRef}
                      src={dump.content}
                      controls
                      className="w-full h-auto rounded-lg max-h-96"
                      preload="metadata"
                      onError={(e) => {
                        e.currentTarget.poster = "https://via.placeholder.com/400x300?text=Video+Not+Found"
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="relative w-full">
              <div className="flex items-center">
                {/* Left: votes (unchanged) */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVote("up")}
                    className="flex items-center gap-2"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {localUpvotes}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVote("down")}
                    className="flex items-center gap-2"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    {localDownvotes}
                  </Button>

                  {!hideCommentsButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowComments(!showComments)}
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {dump.commentCount || 0}
                    </Button>
                  )}
                </div>

                {/* Spacer to push rating to the right */}
                <div className="ml-auto text-sm text-muted-foreground">{dump.rating.toFixed(1)}★</div>
              </div>

              {/* Center: absolutely centered across the whole row on sm+ only */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden sm:block z-20">
                {showGetAnotherButton && onGetAnother && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onGetAnother}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Shuffle className="w-4 h-4" />
                    Get Another
                  </Button>
                )}
              </div>

              {/* Mobile fallback: show Get Another as a centered full-width (or auto) button below actions */}
              <div className="w-full flex justify-center mt-3 sm:hidden">
                {showGetAnotherButton && onGetAnother && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onGetAnother}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Shuffle className="w-4 h-4" />
                    Get Another
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Inline Comments Section */}
        {showComments && (
          <div>
            <div className="flex items-center gap-2 -mt-2 -ml-3 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(false)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Comments</h3>
            </div>
            <CommentsSection dumpId={dump.id} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DumpCard
