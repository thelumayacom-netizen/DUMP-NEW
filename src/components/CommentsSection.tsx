"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageCircle } from "lucide-react"
import { getCommentsByDumpId, addComment, type Comment } from "@/services/supabaseService"
import { useToast } from "@/hooks/use-toast"

interface CommentsSectionProps {
  dumpId: string
}

const CommentsSection = ({ dumpId }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

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

  // Auto-scroll to bottom when comments change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [comments])

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
    <div className="flex flex-col h-[350px] max-h-[60vh]">
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
          <div className="space-y-2 pb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-border/50 pb-2">
                <div className="py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{formatTimestamp(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed break-words">{comment.content}</p>
                  {(comment.upvotes > 0 || comment.downvotes > 0) && (
                    <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                      {comment.upvotes > 0 && <span>👍 {comment.upvotes}</span>}
                      {comment.downvotes > 0 && <span>👎 {comment.downvotes}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
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
              {isSubmitting ? "Posting..." : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentsSection
