// src/lib/uploadToArchives.ts
import { supabase } from './supabase';

export const uploadToArchives = async (dataUrl: string, sandboxType: string): Promise<boolean> => {
  try {
    // 1. Convert base64 Image Data to a standard File Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const fileName = `${sandboxType}-${Date.now()}.png`;

    // 2. Upload to Supabase Storage (Bucket must be named 'archives')
    const { error: uploadError } = await supabase.storage
      .from('archives')
      .upload(fileName, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 3. Get the Public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from('archives')
      .getPublicUrl(fileName);

    // 4. Insert the record into your 'creations' table for the Gallery to read
    const { error: dbError } = await supabase
      .from('creations')
      .insert([
        {
          image_url: publicUrlData.publicUrl,
          sandbox_type: sandboxType
        }
      ]);

    if (dbError) throw dbError;

    return true;
  } catch (error) {
    console.error(`Failed to save ${sandboxType} creation:`, error);
    return false;
  }
};