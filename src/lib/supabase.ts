import { createClient } from '@supabase/supabase-js';

// You will get these from your Supabase Dashboard later
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Utility function to convert DataUrl to Blob (required for storage upload)
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}