"use server";

import type { SearchParams, Influencer } from "@/types";
import { suggestSearchTerms } from "@/ai/flows/suggest-search-terms";
import type { SuggestSearchTermsOutput } from "@/ai/flows/suggest-search-terms";

const mockInfluencers: Influencer[] = [
    { id: '1', username: 'stylemaven', full_name: 'Alex Doe', biography: 'Fashion lover & blogger. Exploring the world one outfit at a time. DM for collabs!', followers_count: 1500000, posts_count: 1200, engagement_rate: 2.5, connector: 'instagram', location_country: 'USA', location_city: 'New York', profile_pic_url: 'https://placehold.co/150x150.png', category: 'Fashion' },
    { id: '2', username: 'gamergod', full_name: 'Ben Carter', biography: 'Pro gamer streaming daily. Come hang out!', followers_count: 3200000, posts_count: 500, engagement_rate: 5.1, connector: 'youtube', location_country: 'Canada', location_city: 'Toronto', profile_pic_url: 'https://placehold.co/150x150.png', category: 'Gaming' },
    { id: '3', username: 'techtrends', full_name: 'Chloe Davis', biography: 'Unboxing the latest tech gadgets. Your daily dose of tech news and reviews.', followers_count: 850000, posts_count: 800, engagement_rate: 3.2, connector: 'youtube', location_country: 'UK', location_city: 'London', profile_pic_url: 'https://placehold.co/150x150.png', category: 'Tech' },
    { id: '4', username: 'foodiefinds', full_name: 'Diana Evans', biography: 'Eating my way through the city. Restaurant reviews and recipes.', followers_count: 500000, posts_count: 2500, engagement_rate: 4.0, connector: 'instagram', location_country: 'USA', location_city: 'Los Angeles', profile_pic_url: 'https://placehold.co/150x150.png', category: 'Food' },
    { id: '5', username: 'travelholic', full_name: 'Frank Green', biography: 'Backpacking the globe and sharing my adventures. 50+ countries and counting.', followers_count: 2100000, posts_count: 950, engagement_rate: 2.8, connector: 'instagram', location_country: 'Australia', location_city: 'Sydney', profile_pic_url: 'https://placehold.co/150x150.png', category: 'Travel' },
];

export async function searchInfluencers(
  params: SearchParams
): Promise<{ data?: Influencer[]; error?: string }> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    console.warn("RAPIDAPI_KEY is not set in .env.local. Using mock data. Create a .env.local file with your RapidAPI key to use the live API.");
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    const filteredData = mockInfluencers.filter(i => {
        if (params.connector && params.connector !== 'all' && i.connector !== params.connector) return false;
        if (params.category && i.category.toLowerCase() !== params.category.toLowerCase()) return false;
        if (params.country && !i.location_country.toLowerCase().includes(params.country.toLowerCase())) return false;
        if (params.city && !i.location_city.toLowerCase().includes(params.city.toLowerCase())) return false;
        if (params.followers_min && i.followers_count < params.followers_min) return false;
        if (params.followers_max && i.followers_count > params.followers_max) return false;
        if (params.engagement_rate_min && i.engagement_rate < params.engagement_rate_min) return false;
        if (params.engagement_rate_max && i.engagement_rate > params.engagement_rate_max) return false;
        if (params.posts_min && i.posts_count < params.posts_min) return false;
        if (params.posts_max && i.posts_count > params.posts_max) return false;
        if (params.bio_keyword) {
            const keyword = params.bio_keyword.toLowerCase();
            if (!i.biography.toLowerCase().includes(keyword) && !i.username.toLowerCase().includes(keyword) && !i.full_name.toLowerCase().includes(keyword)) {
                return false;
            }
        }
        return true;
    });
    return { data: filteredData };
  }

  const query = new URLSearchParams();
  
  if (params.bio_keyword) query.append("q", params.bio_keyword);
  if (params.connector && params.connector !== 'all') query.append("connector", params.connector);
  if (params.category) query.append("category", params.category);
  if (params.country) query.append("location_country", params.country);
  if (params.city) query.append("location_city", params.city);
  if (params.followers_min) query.append("followers_min", params.followers_min.toString());
  if (params.followers_max) query.append("followers_max", params.followers_max.toString());
  if (params.engagement_rate_min) query.append("engagement_rate_min", params.engagement_rate_min.toString());
  if (params.engagement_rate_max) query.append("engagement_rate_max", params.engagement_rate_max.toString());

  const url = `https://ylytic-influencer-discovery.p.rapidapi.com/search_v2?${query.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "ylytic-influencer-discovery.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      return { error: `API Error: ${errorData.message || 'Failed to fetch data'}` };
    }

    const result = await response.json();
    return { data: result.creators as Influencer[] };
  } catch (error) {
    console.error("Fetch Error:", error);
    return { error: "Failed to connect to the API. Please check your network connection." };
  }
}

export async function getSuggestions(
  searchTerm: string
): Promise<SuggestSearchTermsOutput | null> {
  if (!searchTerm.trim()) {
    return null;
  }
  try {
    return await suggestSearchTerms({ searchTerm });
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return null;
  }
}
