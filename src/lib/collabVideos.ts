export interface CollabVideo {
  id: string;
  creatorName: string;
  instagramUrl: string;
  thumbnailUrl: string;
  caption: string;
  viewsLabel?: string;
}

// Replace instagramUrl values with your real creator reel links.
export const COLLAB_VIDEOS: CollabVideo[] = [
  {
    id: "collab-1",
    creatorName: "@creator_one",
    instagramUrl: "https://www.instagram.com/p/DVlU5iXEXLl/?hl=en",
    thumbnailUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=540&h=960&fit=crop",
    caption: "BijNoor hair mask wash-day glow-up",
    viewsLabel: "48K views",
  },
  {
    id: "collab-2",
    creatorName: "@creator_two",
    instagramUrl: "https://www.instagram.com/reel/C7EXAMPLE2/",
    thumbnailUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=540&h=960&fit=crop",
    caption: "3-step frizz control routine",
    viewsLabel: "72K views",
  },
  {
    id: "collab-3",
    creatorName: "@creator_three",
    instagramUrl: "https://www.instagram.com/reel/C7EXAMPLE3/",
    thumbnailUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=540&h=960&fit=crop",
    caption: "Scalp care before styling",
    viewsLabel: "29K views",
  },
  {
    id: "collab-4",
    creatorName: "@creator_four",
    instagramUrl: "https://www.instagram.com/reel/C7EXAMPLE4/",
    thumbnailUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=540&h=960&fit=crop",
    caption: "Weekly hair reset with BijNoor",
    viewsLabel: "60K views",
  },
  {
    id: "collab-5",
    creatorName: "@creator_five",
    instagramUrl: "https://www.instagram.com/reel/C7EXAMPLE5/",
    thumbnailUrl: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=540&h=960&fit=crop",
    caption: "Post-color repair ritual",
    viewsLabel: "33K views",
  },
  {
    id: "collab-6",
    creatorName: "@creator_six",
    instagramUrl: "https://www.instagram.com/reel/C7EXAMPLE6/",
    thumbnailUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=540&h=960&fit=crop",
    caption: "Night routine for stronger roots",
    viewsLabel: "41K views",
  },
  {
    id: "collab-7",
    creatorName: "@creator_seven",
    instagramUrl: "https://www.instagram.com/reel/C7EXAMPLE7/",
    thumbnailUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=540&h=960&fit=crop",
    caption: "Monsoon haircare essentials",
    viewsLabel: "19K views",
  },
  {
    id: "collab-8",
    creatorName: "@creator_eight",
    instagramUrl: "https://www.instagram.com/reel/C7EXAMPLE8/",
    thumbnailUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=540&h=960&fit=crop",
    caption: "Before/after hydration challenge",
    viewsLabel: "84K views",
  },
];
