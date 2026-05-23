"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, PauseCircle, ExternalLink } from "lucide-react";
import { COLLAB_VIDEOS } from "@/lib/collabVideos";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

interface CollabFromApi {
  _id: string;
  creatorName: string;
  instagramUrl: string;
  thumbnailUrl: string;
  caption: string;
  viewsLabel?: string;
}

function toInstagramEmbedUrl(instagramUrl: string) {
  const clean = instagramUrl.split("?")[0].replace(/\/$/, "");
  return `${clean}/embed`;
}

export default function CreatorCollabs() {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [videos, setVideos] = useState<CollabFromApi[]>([]);

  useEffect(() => {
    const fetchCollabs = async () => {
      try {
        const res = await fetch("/api/collabs", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && Array.isArray(data.collabs)) {
          setVideos(data.collabs);
        }
      } catch {
        setVideos([]);
      }
    };

    fetchCollabs();
  }, []);

  useRealtimeSync({
    onEvent: (event) => {
      if (event.entity !== 'collab') {
        return;
      }

      void (async () => {
        try {
          const res = await fetch('/api/collabs', { cache: 'no-store' });
          const data = await res.json();
          if (res.ok && Array.isArray(data.collabs)) {
            setVideos(data.collabs);
          }
        } catch {
          setVideos([]);
        }
      })();
    },
  });

  const cards = useMemo(() => {
    const source = videos.length > 0 ? videos : COLLAB_VIDEOS;
    return source.slice(0, 8).map((item: any) => ({
      id: item._id || item.id,
      creatorName: item.creatorName,
      instagramUrl: item.instagramUrl,
      thumbnailUrl: item.thumbnailUrl,
      caption: item.caption,
      viewsLabel: item.viewsLabel,
    }));
  }, [videos]);

  return (
    <section id="creator-collabs" className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold mb-3">
            Social Proof
          </p>
          <h2 className="font-heading text-3xl sm:text-5xl text-dark-text mb-4">
            Creator Collabs
          </h2>
          <p className="text-light-text text-base sm:text-lg max-w-2xl mx-auto">
            Watch how creators use BijNoor in real routines. Swipe on mobile to explore all collab videos.
          </p>
        </motion.div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:snap-none">
          {cards.map((video, index) => {
            const isActive = activeVideoId === video.id;

            return (
              <motion.article
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className="snap-start shrink-0 w-[78vw] sm:w-[44vw] md:w-[34vw] lg:w-auto bg-cream rounded-2xl overflow-hidden border border-beige"
              >
                <div className="relative aspect-[9/16] bg-black">
                  {isActive ? (
                    <iframe
                      title={`Instagram video by ${video.creatorName}`}
                      src={toInstagramEmbedUrl(video.instagramUrl)}
                      className="w-full h-full"
                      loading="lazy"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    />
                  ) : (
                    <>
                      <img
                        src={video.thumbnailUrl}
                        alt={`${video.creatorName} collaboration preview`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/25" />
                      <button
                        onClick={() => setActiveVideoId(video.id)}
                        className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/90 text-dark-text flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                        aria-label={`Play video from ${video.creatorName}`}
                      >
                        <Play size={28} className="ml-1" />
                      </button>
                    </>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-semibold text-dark-text text-sm">{video.creatorName}</p>
                    {video.viewsLabel ? (
                      <span className="text-xs text-light-text">{video.viewsLabel}</span>
                    ) : null}
                  </div>

                  <p className="text-sm text-light-text mb-3 line-clamp-2">{video.caption}</p>

                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <button
                        onClick={() => setActiveVideoId(null)}
                        className="flex-1 min-h-[44px] rounded-lg border border-beige text-dark-text text-sm font-medium flex items-center justify-center gap-2 hover:bg-beige/60"
                      >
                        <PauseCircle size={16} />
                        Stop Preview
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveVideoId(video.id)}
                        className="flex-1 min-h-[44px] rounded-lg bg-gold text-white text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-105"
                      >
                        <Play size={16} />
                        Play Preview
                      </button>
                    )}

                    <a
                      href={video.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[44px] px-3 rounded-lg border border-beige text-dark-text flex items-center justify-center hover:bg-beige/60"
                      aria-label={`Open ${video.creatorName} video on Instagram`}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gold text-gold font-semibold hover:bg-gold hover:text-white"
          >
            View All Collaborations
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
