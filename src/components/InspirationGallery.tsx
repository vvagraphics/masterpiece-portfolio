import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
// import InspirationGallery from './InspirationGallery';

interface Creation {
  id: string;
  image_url: string;
  sandbox_type: string;
  created_at: string;
}

export default function InspirationGallery() {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      // Fetch the 20 most recent creations from Supabase
      const { data, error } = await supabase
        .from('creations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setCreations(data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-20 flex justify-center items-center">
        <div className="animate-pulse text-zinc-500 font-mono tracking-widest">
          [ LOADING ARCHIVES... ]
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-24">
      <div className="flex items-end justify-between mb-8 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-4xl font-serif text-white">Community Archives</h2>
          <p className="text-zinc-500 font-mono text-sm mt-2">LATEST EXPORTS FROM THE MUSEUM</p>
        </div>
        <button 
          onClick={fetchGallery}
          className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {creations.length === 0 ? (
        <div className="text-zinc-600 font-mono py-12 text-center border border-dashed border-zinc-800">
          The gallery is empty. Be the first to leave a mark.
        </div>
      ) : (
        /* Masonry-style Grid */
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {creations.map((item) => (
            <div 
              key={item.id} 
              className="break-inside-avoid relative group overflow-hidden border border-zinc-800 bg-zinc-900 rounded-sm"
            >
              <img 
                src={item.image_url} 
                alt="User creation" 
                className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              
              {/* Hover Overlay with Metadata */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 backdrop-blur-sm">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Engine: {item.sandbox_type.replace('_', ' ')}
                </span>
                <span className="text-white text-sm font-medium">
                  {new Date(item.created_at).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}