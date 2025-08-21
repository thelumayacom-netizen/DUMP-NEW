import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      dumps: {
        Row: {
          id: string;
          type: 'text' | 'image' | 'voice' | 'video';
          content: string;
          tags: string[];
          upvotes: number;
          downvotes: number;
          rating: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'text' | 'image' | 'voice' | 'video';
          content: string;
          tags?: string[];
          upvotes?: number;
          downvotes?: number;
          rating?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'text' | 'image' | 'voice' | 'video';
          content?: string;
          tags?: string[];
          upvotes?: number;
          downvotes?: number;
          rating?: number;
          created_at?: string;
        };
      };
    };
  };
};