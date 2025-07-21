
"use server";

import type { SearchParams, Influencer, YlyticInfluencer, City, SignUpCredentials } from "@/types";
import { suggestSearchTerms } from "@/ai/flows/suggest-search-terms";
import type { SuggestSearchTermsOutput } from "@/ai/flows/suggest-search-terms";
import { logger } from "@/lib/logger";
import { getAllCities, getInfluencersByCity as dbGetInfluencersByCity, saveInfluencers } from '@/lib/cityService';
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";


const mapYlyticToInfluencer = (ylyticData: YlyticInfluencer[]): Omit<Influencer, 'city_id'>[] => {
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
    
    if (creators === null || creators.length === 0) {
      return { data: [] };
    }
    
    const mappedData = mapYlyticToInfluencer(creators);
    await saveInfluencers(params.city, mappedData);
    
    const finalData = await dbGetInfluencersByCity(params.city);
    return { data: finalData };

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


export async function getInfluencersByCity(city: string): Promise<Influencer[]> {
  try {
    return await dbGetInfluencersByCity(city);
  } catch(e) {
    logger.error("Error fetching influencers by city from DB", e);
    return [];
  }
}

export async function getCities(): Promise<City[]> {
    try {
        return await getAllCities();
    } catch(e) {
        logger.error("Error fetching cities from DB", e);
        return [];
    }
}

export async function signUpUser(credentials: SignUpCredentials): Promise<{ success: boolean; error?: string }> {
  const { name, email, password } = credentials;
  
  // This is a workaround for the client-side Firebase SDK usage in Server Actions
  // In a real production app, you'd use the Firebase Admin SDK here.
  const clientAuth = auth;

  try {
    const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
    const user = userCredential.user;

    // Now create a document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      name: name,
      email: email,
      role: "user",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      // We do NOT store the password in Firestore. It is handled securely by Firebase Auth.
    });

    return { success: true };
  } catch (error: any) {
    logger.error("SIGNUP ERROR", { code: error.code, message: error.message });
    // Provide a user-friendly error message
    let errorMessage = "An unknown error occurred during signup.";
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email address is already in use by another account.";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "The password is too weak. Please use at least 6 characters.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "The email address is not valid."
    }
    return { success: false, error: errorMessage };
  }
}
