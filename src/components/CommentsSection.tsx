"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageCircle } from "lucide-react"
import { getCommentsByDumpId, addComment, rateComment, type Comment } from "@/services/supabaseService"
import { useToast } from "@/hooks/use-toast"

interface CommentsSectionProps {
  dumpId: string
}

interface UserVotes {
  [commentId: string]: 'up' | 'down'
}

const CommentsSection = ({ dumpId }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userVotes, setUserVotes] = useState<UserVotes>({})
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load user votes from localStorage
  useEffect(() => {
    const loadUserVotes = () => {
      try {
        const storedVotes = localStorage.getItem(`comment_votes_${dumpId}`)
        if (storedVotes) {
          setUserVotes(JSON.parse(storedVotes))
        }
      } catch (error) {
        console.error("Failed to load user votes from localStorage:", error)
        setUserVotes({})
      }
    }

    loadUserVotes()
  }, [dumpId])

  // Save user votes to localStorage
  const saveUserVotes = (votes: UserVotes) => {
    try {
      localStorage.setItem(`comment_votes_${dumpId}`, JSON.stringify(votes))
    } catch (error) {
      console.error("Failed to save user votes to localStorage:", error)
    }
  }

  // Load comments on component mount
  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true)
      try {
        const fetchedComments = await getCommentsByDumpId(dumpId)
        setComments(fetchedComments)
      } catch (error) {
        console.error("Failed to load comments:", error)
        toast({
          title: "Error",
          description: "Failed to load comments. Please try again.",
          variant: "destructive",
          duration: 3000,
        })
      }
      setIsLoading(false)
    }

    loadComments()
  }, [dumpId, toast])

  // Format timestamp for display
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

  // Handle comment voting
  const handleVoteComment = async (commentId: string, rating: 'up' | 'down') => {
    // Check if user has already voted on this comment
    const existingVote = userVotes[commentId]
    
    if (existingVote) {
      if (existingVote === rating) {
        toast({
          title: "Already voted",
          description: `You have already ${rating === 'up' ? 'liked' : 'disliked'} this comment.`,
          duration: 2000,
        })
        return
      } else {
        toast({
          title: "Vote changed",
          description: `You can only vote once per comment. Your previous ${existingVote === 'up' ? 'like' : 'dislike'} will be replaced.`,
          duration: 2000,
        })
        return
      }
    }

    try {
      const result = await rateComment(commentId, rating)
      
      if (result.success) {
        // Update local state optimistically
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? {
                ...comment,
                upvotes: rating === 'up' ? comment.upvotes + 1 : comment.upvotes,
                downvotes: rating === 'down' ? comment.downvotes + 1 : comment.downvotes
              }
            : comment
        ))
        
        // Update user votes state and save to localStorage
        const newUserVotes = { ...userVotes, [commentId]: rating }
        setUserVotes(newUserVotes)
        saveUserVotes(newUserVotes)
        
        toast({
          title: "Vote recorded!",
          description: `Comment ${rating === 'up' ? 'liked' : 'disliked'} successfully.`,
          duration: 1500,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const result = await addComment({
        dump_id: dumpId,
        content: newComment.trim(),
      })

      if (result.success && result.comment) {
        setComments((prev) => [...prev, result.comment!])
        setNewComment("")
        toast({
          title: "Comment added!",
          description: "Your comment has been posted.",
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
    } catch (error) {
      console.error("Failed to add comment:", error)
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
    setIsSubmitting(false)
  }

  // Handle Enter key press (submit comment)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment()
    }
  }

  return (
    <div className="flex flex-col h-[280px] max-h-[50vh]">
      {/* Comments List */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-pulse flex items-center justify-center mb-2">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Loading comments...</p>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No comments yet</p>
              <p className="text-muted-foreground text-sm">Be the first to share your thoughts!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {comments.map((comment) => {
              const userVote = userVotes[comment.id]
              return (
                <div key={comment.id} className="border-b border-border/50 pb-1">
                  <div className="py-1">
                    <div className="flex items-start gap-2 mb-1">
                      <p className="text-sm text-foreground leading-relaxed break-words flex-1">{comment.content}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(comment.created_at)}
                      </span>
                    </div>
                    
                    {/* Vote buttons */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleVoteComment(comment.id, 'up')}
                          className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-green-600 transition-colors"
                        >
                          <span>👍</span>
                          <span>{comment.upvotes}</span>
                        </button>
                        <button
                          onClick={() => handleVoteComment(comment.id, 'down')}
                          className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <span>👎</span>
                          <span>{comment.downvotes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Comment Input */}
      <div className="border-t pt-4 mt-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[60px] resize-none"
            maxLength={500}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{newComment.length}/500 characters</span>
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentsSection