import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

export type Dump = Database['public']['Tables']['dumps']['Row'];
export type DumpInsert = Database['public']['Tables']['dumps']['Insert'];

// Add Comment types
export type Comment = {
  id: string;
  dump_id: string;
  content: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
};

export type CommentInsert = {
  dump_id: string;
  content: string;
};

// Categories remain static for now, but can be made dynamic later
export const categories = [
  { name: 'Funny', count: 0, color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Deep', count: 0, color: 'bg-purple-100 text-purple-800' },
  { name: 'Weird', count: 0, color: 'bg-green-100 text-green-800' },
  { name: 'Sad', count: 0, color: 'bg-blue-100 text-blue-800' },
  { name: 'Dreams', count: 0, color: 'bg-pink-100 text-pink-800' },
  { name: 'Food', count: 0, color: 'bg-orange-100 text-orange-800' },
  { name: 'Adult-life', count: 0, color: 'bg-gray-100 text-gray-800' },
  { name: 'Awkward', count: 0, color: 'bg-red-100 text-red-800' },
  { name: 'Confessions', count: 0, color: 'bg-indigo-100 text-indigo-800' }
];

// Simple in-memory cache for dumps
const dumpCache = {
  dumps: [] as DumpWithTimestamp[],
  lastFetch: 0,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
  seenDumps: new Set<string>(), // Track seen dump IDs
  isExpired(): boolean {
    return Date.now() - this.lastFetch > this.cacheExpiry;
  },
  clear(): void {
    this.dumps = [];
    this.lastFetch = 0;
    this.seenDumps.clear(); // Clear seen dumps when cache is cleared
  }
};

// Helper function to get storage bucket based on file type
const getStorageBucket = (fileType: string): string => {
  if (fileType.startsWith('image/')) return 'dump-images';
  if (fileType.startsWith('audio/')) return 'dump-audio';
  if (fileType.startsWith('video/')) return 'dump-videos';
  throw new Error('Unsupported file type');
};

// Helper function to get dump type based on file type
const getDumpType = (fileType: string): 'image' | 'voice' | 'video' => {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('audio/')) return 'voice';
  if (fileType.startsWith('video/')) return 'video';
  throw new Error('Unsupported file type');
};

// Add timestamp field to Dump type for consistency
export type DumpWithTimestamp = Dump & {
  timestamp: string;
  comments?: Comment[];
  commentCount?: number;
  title?: string | null; // Add title field
};

// Fetch dumps from database and update cache (excluding voice memos)
const fetchAndCacheDumps = async (): Promise<DumpWithTimestamp[]> => {
  try {
    const { data, error } = await supabase
      .from('dumps')
      .select('*')
      .neq('type', 'voice') // Exclude voice memos
      .limit(500); // Increase limit for better cache

    if (error) {
      console.error('Error fetching dumps:', error);
      throw error;
    }

    const dumpsWithTimestamp = (data || []).map(dump => ({
      ...dump,
      timestamp: dump.created_at
    }));

    // Update cache
    dumpCache.dumps = dumpsWithTimestamp;
    dumpCache.lastFetch = Date.now();

    return dumpsWithTimestamp;
  } catch (error) {
    console.error('Fetch and cache dumps failed:', error);
    throw error;
  }
};

// Upload file to Supabase Storage
export const uploadFile = async (file: File): Promise<string> => {
  try {
    const bucket = getStorageBucket(file.type);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};

// Upload dump to database (still allows voice uploads for the event)
export const uploadDump = async (dumpData: {
  type: 'text' | 'image' | 'voice' | 'video';
  content: string;
  tags: string[];
  file?: File;
  title?: string; // Add title parameter
}): Promise<{ success: boolean; message: string; dump?: Dump }> => {
  try {
    let content = dumpData.content;

    // If there's a file, upload it first
    if (dumpData.file) {
      content = await uploadFile(dumpData.file);
    }

    const insertData: DumpInsert = {
      type: dumpData.type,
      content,
      tags: dumpData.tags,
      title: dumpData.title || null, // Add title to insert data
    };

    const { data, error } = await supabase
      .from('dumps')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error(`Failed to save dump: ${error.message}`);
    }

    // Clear cache to ensure fresh data on next fetch
    dumpCache.clear();

    return {
      success: true,
      message: dumpData.type === 'voice' 
        ? "Voice memo submitted successfully! It will be revealed during our special event." 
        : "Dump submitted successfully!",
      dump: data
    };
  } catch (error) {
    console.error('Upload dump failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to submit dump"
    };
  }
};

// Get random dump with caching (excluding voice memos)
export const getRandomDump = async (): Promise<DumpWithTimestamp | null> => {
  try {
    let dumps: DumpWithTimestamp[] = [];

    // Check if cache is valid and has data
    if (dumpCache.dumps.length > 0 && !dumpCache.isExpired()) {
      dumps = dumpCache.dumps;
    } else {
      // Fetch from database and update cache
      dumps = await fetchAndCacheDumps();
    }

    if (!dumps || dumps.length === 0) {
      // Return a sample dump if no data exists
      return {
        id: 'sample-1',
        type: 'text',
        content: 'Welcome to DumpSpace! This is a sample dump. Submit your own thoughts to see real content from the community.',
        title: 'Welcome to DumpSpace!', // Add title to sample
        tags: ['welcome', 'sample'],
        upvotes: 42,
        downvotes: 3,
        rating: 4.2,
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
    }

    // Filter out dumps that have already been seen
    const unseenDumps = dumps.filter(dump => !dumpCache.seenDumps.has(dump.id));

    let selectedDump: DumpWithTimestamp;

    // If all dumps have been seen, reset and start over
    if (unseenDumps.length === 0) {
      dumpCache.seenDumps.clear();
      const randomIndex = Math.floor(Math.random() * dumps.length);
      selectedDump = dumps[randomIndex];
      dumpCache.seenDumps.add(selectedDump.id);
    } else {
      // Select random dump from unseen dumps and mark as seen
      const randomIndex = Math.floor(Math.random() * unseenDumps.length);
      selectedDump = unseenDumps[randomIndex];
      dumpCache.seenDumps.add(selectedDump.id);
    }
    
    // Fetch comments for this dump
    const comments = await getCommentsByDumpId(selectedDump.id);
    
    return {
      ...selectedDump,
      comments,
      commentCount: comments.length
    };

  } catch (error) {
    console.error('Get random dump failed:', error);
    // Return sample dump on error
    return {
      id: 'sample-error',
      type: 'text',
      content: 'Unable to fetch dumps right now. This is a sample dump to show you how DumpSpace works!',
      title: 'Connection Error', // Add title to error sample
      tags: ['sample'],
      upvotes: 10,
      downvotes: 1,
      rating: 3.8,
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
  }
};

// Get dumps by category (excluding voice memos)
export const getDumpsByCategory = async (category: string): Promise<DumpWithTimestamp[]> => {
  try {
    const { data, error } = await supabase
      .from('dumps')
      .select('*')
      .contains('tags', [category.toLowerCase()])
      .neq('type', 'voice') // Exclude voice memos
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dumps by category:', error);
      return [];
    }

    return (data || []).map(dump => ({
      ...dump,
      timestamp: dump.created_at
    }));
  } catch (error) {
    console.error('Get dumps by category failed:', error);
    return [];
  }
};

// Rate dump (upvote/downvote)
export const rateDump = async (id: string, rating: 'up' | 'down'): Promise<{ success: boolean; message: string }> => {
  try {
    // First, get current vote counts
    const { data: currentDump, error: fetchError } = await supabase
      .from('dumps')
      .select('upvotes, downvotes')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch dump: ${fetchError.message}`);
    }

    // Update vote counts
    const updates = rating === 'up' 
      ? { upvotes: currentDump.upvotes + 1 }
      : { downvotes: currentDump.downvotes + 1 };

    const { error: updateError } = await supabase
      .from('dumps')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      throw new Error(`Failed to update vote: ${updateError.message}`);
    }

    // Update cache if the dump exists in cache
    const cachedDumpIndex = dumpCache.dumps.findIndex(dump => dump.id === id);
    if (cachedDumpIndex !== -1) {
      if (rating === 'up') {
        dumpCache.dumps[cachedDumpIndex].upvotes += 1;
      } else {
        dumpCache.dumps[cachedDumpIndex].downvotes += 1;
      }
    }

    return {
      success: true,
      message: `${rating === 'up' ? '👍 Upvoted' : '👎 Downvoted'} successfully!`
    };
  } catch (error) {
    console.error('Rate dump failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to rate dump"
    };
  }
};

// Report dump (placeholder - you might want to add a reports table later)
export const reportDump = async (id: string): Promise<{ success: boolean; message: string }> => {
  // For now, just log the report
  console.log(`Dump ${id} reported for moderation`);
  
  // In a real implementation, you might:
  // 1. Add a 'reports' table
  // 2. Insert a report record
  // 3. Potentially flag the dump for review
  
  return {
    success: true,
    message: "🚩 Dump reported for moderation. Thank you for keeping our community safe!"
  };
};

export const getTopRatedDumps = async (): Promise<DumpWithTimestamp[]> => {
  try {
    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // First check if there are at least 10 posts in last 24 hours (excluding voice)
    const { data: recentData, error: recentError } = await supabase
      .from('dumps')
      .select('*')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .neq('type', 'voice') // Exclude voice memos
      .order('upvotes', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('Error fetching recent dumps:', recentError);
      return [];
    }

    // If we have 10 or more posts in last 24 hours, return them
    if (recentData && recentData.length >= 10) {
      return recentData.map(dump => ({
        ...dump,
        timestamp: dump.created_at
      }));
    }

    // Otherwise, get top 10 without time limit (excluding voice)
    const { data, error } = await supabase
      .from('dumps')
      .select('*')
      .neq('type', 'voice') // Exclude voice memos
      .order('upvotes', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching top rated dumps:', error);
      return [];
    }

    return (data || []).map(dump => ({
      ...dump,
      timestamp: dump.created_at
    }));
  } catch (error) {
    console.error('Get top rated dumps failed:', error);
    return [];
  }
};

// Get recent dumps (excluding voice memos)
export const getRecentDumps = async (limit: number = 10): Promise<DumpWithTimestamp[]> => {
  try {
    const { data, error } = await supabase
      .from('dumps')
      .select('*')
      .neq('type', 'voice') // Exclude voice memos
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent dumps:', error);
      return [];
    }

    return (data || []).map(dump => ({
      ...dump,
      timestamp: dump.created_at
    }));
  } catch (error) {
    console.error('Get recent dumps failed:', error);
    return [];
  }
};

// Get dump statistics (excluding voice memos for public stats)
export const getDumpStats = async () => {
  try {
    const { count, error } = await supabase
      .from('dumps')
      .select('*', { count: 'exact', head: true })
      .neq('type', 'voice'); // Exclude voice memos from public count

    if (error) {
      console.error('Error fetching dump stats:', error);
      return { totalDumps: 0 };
    }

    return { totalDumps: count || 0 };
  } catch (error) {
    console.error('Get dump stats failed:', error);
    return { totalDumps: 0 };
  }
};



// Update category counts (call this periodically or on demand)
export const updateCategoryStats = async () => {
  try {
    const updatedCategories = await Promise.all(
      categories.map(async (category) => {
        const dumps = await getDumpsByCategory(category.name);
        return { ...category, count: dumps.length };
      })
    );
    return updatedCategories;
  } catch (error) {
    console.error('Update category stats failed:', error);
    return categories;
  }
};

// === COMMENT FUNCTIONS ===

// Get comments for a specific dump
export const getCommentsByDumpId = async (dumpId: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('dump_id', dumpId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get comments by dump ID failed:', error);
    return [];
  }
};

// Add a new comment
export const addComment = async (commentData: CommentInsert): Promise<{ success: boolean; message: string; comment?: Comment }> => {
  try {
    // Validate comment content
    if (!commentData.content.trim()) {
      return {
        success: false,
        message: "Comment cannot be empty"
      };
    }

    if (commentData.content.length > 500) {
      return {
        success: false,
        message: "Comment is too long (max 500 characters)"
      };
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        dump_id: commentData.dump_id,
        content: commentData.content.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error for comment:', error);
      throw new Error(`Failed to save comment: ${error.message}`);
    }

    return {
      success: true,
      message: "Comment added successfully!",
      comment: data
    };
  } catch (error) {
    console.error('Add comment failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add comment"
    };
  }
};

// Rate a comment (upvote/downvote)
export const rateComment = async (commentId: string, rating: 'up' | 'down'): Promise<{ success: boolean; message: string }> => {
  try {
    // First, get current vote counts
    const { data: currentComment, error: fetchError } = await supabase
      .from('comments')
      .select('upvotes, downvotes')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch comment: ${fetchError.message}`);
    }

    // Update vote counts
    const updates = rating === 'up' 
      ? { upvotes: currentComment.upvotes + 1 }
      : { downvotes: currentComment.downvotes + 1 };

    const { error: updateError } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', commentId);

    if (updateError) {
      throw new Error(`Failed to update comment vote: ${updateError.message}`);
    }

    return {
      success: true,
      message: `Comment ${rating === 'up' ? 'upvoted' : 'downvoted'} successfully!`
    };
  } catch (error) {
    console.error('Rate comment failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to rate comment"
    };
  }
};

// Delete comment (for moderation purposes - you might want to add admin auth later)
export const deleteComment = async (commentId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }

    return {
      success: true,
      message: "Comment deleted successfully"
    };
  } catch (error) {
    console.error('Delete comment failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete comment"
    };
  }
};