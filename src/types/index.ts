
export interface Influencer {
  id: string;
  username: string;
  full_name: string;
  biography: string;
  followers_count: number;
  posts_count: number;
  engagement_rate: number;
  connector: 'instagram' | 'youtube';
  location_country: string;
  location_city: string;
  profile_pic_url: string;
  category: string;
}

export interface SearchParams {
  city?: string;
  country?: string;
  category?: string;
  connector?: 'instagram' | 'youtube' | 'all';
  followers_min?: number;
  followers_max?: number;
  engagement_rate_min?: number;
  engagement_rate_max?: number;
  posts_min?: number;
  posts_max?: number;
  bio_keyword?: string;
}

export interface YlyticInfluencer {
    bio: string;
    category: string | null;
    city: string | null;
    connector: 'instagram' | 'youtube';
    country: string;
    engagement: number;
    followers: number;
    handle: string;
    handle_link: string;
    posts: number;
}

export interface City {
    id: number;
    name: string;
}

export interface SignUpCredentials {
    name: string;
    email: string;
    password: string;
}
