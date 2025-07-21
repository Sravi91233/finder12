
"use server";

import type { SearchParams, Influencer, YlyticInfluencer, City, SignUpCredentials } from "@/types";
import { suggestSearchTerms } from "@/ai/flows/suggest-search-terms";
import type { SuggestSearchTermsOutput } from "@/ai/flows/suggest-search-terms";
import { logger } from "@/lib/logger";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDocs, collection, writeBatch, getDoc, query, collectionGroup } from "firebase/firestore";


const mapYlyticToInfluencer = (ylyticData: YlyticInfluencer[]): Omit<Influencer, 'city_id'>[] => {
    return ylyticData.map(creator => ({
        id: creator.handle.replace(/@/g, ''),
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

  const queryParams = new URLSearchParams({ current_page: '1' });
  
  if (params.bio_keyword) queryParams.append("bio_contains", params.bio_keyword);
  if (params.connector && params.connector !== 'all') queryParams.append("connector", params.connector);
  if (params.category && params.category !== 'all') queryParams.append("category", params.category);
  if (params.country) queryParams.append("country", params.country);
  if (params.city) queryParams.append("city", params.city);

  if (params.followers_min !== undefined) queryParams.append("followers_minimum", params.followers_min.toString());
  if (params.followers_max !== undefined && params.followers_max < 10000000) queryParams.append("followers_maximum", params.followers_max.toString());
  if (params.engagement_rate_min !== undefined) queryParams.append("engagement_rate_minimum", params.engagement_rate_min.toString());
  if (params.engagement_rate_max !== undefined && params.engagement_rate_max < 100) queryParams.append("engagement_rate_maximum", params.engagement_rate_max.toString());
  if (params.posts_min !== undefined) queryParams.append("posts_minimum", params.posts_min.toString());
  if (params.posts_max !== undefined && params.posts_max < 5000) queryParams.append("posts_maximum", params.posts_max.toString());


  const url = `https://ylytic-influencers-api.p.rapidapi.com/ylytic/admin/api/v1/discovery?${queryParams.toString()}`;
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
    
    const finalData = await getInfluencersByCity(params.city);
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
    const influencersRef = collection(db, "cities", city, "influencers");
    const snapshot = await getDocs(influencersRef);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => doc.data() as Influencer);
  } catch(e) {
    logger.error(`Error fetching influencers by city from Firestore for ${city}`, e);
    return [];
  }
}

export async function getCities(): Promise<City[]> {
    try {
        const citiesRef = collection(db, "cities");
        const snapshot = await getDocs(citiesRef);
        return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as City));
    } catch(e) {
        logger.error("Error fetching cities from Firestore", e);
        return [];
    }
}


export async function saveInfluencers(cityName: string, influencers: Omit<Influencer, 'city_id'>[]): Promise<void> {
  try {
    const cityRef = doc(db, "cities", cityName);
    const citySnap = await getDoc(cityRef);

    const batch = writeBatch(db);

    // If city doesn't exist, create it
    if (!citySnap.exists()) {
        batch.set(cityRef, { name: cityName, createdAt: serverTimestamp() });
    }

    // Add/update each influencer in a subcollection
    for (const influencer of influencers) {
        const influencerRef = doc(db, "cities", cityName, "influencers", influencer.id);
        batch.set(influencerRef, { ...influencer, lastUpdated: serverTimestamp() });
    }

    await batch.commit();
    logger.info(`Successfully saved ${influencers.length} influencers for city: ${cityName} to Firestore`);

  } catch (error) {
    logger.error(`Failed to save influencers for city: ${cityName} to Firestore`, error);
    // Optionally re-throw or handle the error as needed
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
