
"use server";

import type { SearchParams, Influencer, YlyticInfluencer } from "@/types";
import { suggestSearchTerms } from "@/ai/flows/suggest-search-terms";
import type { SuggestSearchTermsOutput } from "@/ai/flows/suggest-search-terms";
import { logger } from "@/lib/logger";

const mapYlyticToInfluencer = (ylyticData: YlyticInfluencer[]): Influencer[] => {
    return ylyticData.map(creator => ({
        id: creator.handle,
        username: creator.handle.startsWith('@') ? creator.handle.substring(1) : creator.handle,
        full_name: creator.handle, 
        biography: creator.bio,
        followers_count: creator.followers,
        posts_count: creator.posts,
        engagement_rate: creator.engagement,
        connector: creator.connector,
        location_country: creator.country,
        location_city: creator.city || 'N/A',
        profile_pic_url: `https://placehold.co/150x150.png`, 
        category: creator.category || 'N/A',
    }));
};

export async function searchInfluencers(
  params: SearchParams
): Promise<{ data?: Influencer[]; error?: string }> {
  
  if (!params.city) {
    return { error: "Please provide a City to start your search." };
  }
  
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    logger.error("RAPIDAPI_KEY is not set. Please add it to your .env file.");
    return { error: "API key is not configured. Please contact support." };
  }

  const query = new URLSearchParams({ current_page: '1' });
  
  if (params.bio_keyword) query.append("bio_contains", params.bio_keyword);
  if (params.connector && params.connector !== 'all') query.append("connector", params.connector);
  if (params.category && params.category !== 'all') query.append("category", params.category);
  if (params.country) query.append("country", params.country);
  if (params.city) query.append("city", params.city);

  if (params.followers_min !== undefined) query.append("followers_minimum", params.followers_min.toString());
  if (params.followers_max !== undefined && params.followers_max < 10000000) query.append("followers_maximum", params.followers_max.toString());
  if (params.engagement_rate_min !== undefined) query.append("engagement_rate_minimum", params.engagement_rate_min.toString());
  if (params.engagement_rate_max !== undefined && params.engagement_rate_max < 100) query.append("engagement_rate_maximum", params.engagement_rate_max.toString());
  if (params.posts_min !== undefined) query.append("posts_minimum", params.posts_min.toString());
  if (params.posts_max !== undefined && params.posts_max < 5000) query.append("posts_maximum", params.posts_max.toString());


  const url = `https://ylytic-influencers-api.p.rapidapi.com/ylytic/admin/api/v1/discovery?${query.toString()}`;
  logger.debug(`Fetching from URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "ylytic-influencers-api.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || response.statusText }
      }
      logger.error("API Error while searching influencers", { status: response.status, errorData, params });
      return { error: `API Error: ${errorData.message || errorData.messages || 'Failed to fetch data'}` };
    }

    const result = await response.json();
    const creators = result.creators as YlyticInfluencer[] | null;
    
    if (creators === null) {
      return { data: [] };
    }
    
    const mappedData = mapYlyticToInfluencer(creators);
    return { data: mappedData };
  } catch (error) {
    logger.error("Fetch Error while searching influencers", { error, params });
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
    logger.error("AI Suggestion Error", { error, searchTerm });
    return null;
  }
}
