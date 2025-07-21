
"use server";

import type { SearchParams, Influencer, YlyticInfluencer, City, SignUpCredentials, User } from "@/types";
import { suggestSearchTerms } from "@/ai/flows/suggest-search-terms";
import type { SuggestSearchTermsOutput } from "@/ai/flows/suggest-search-terms";
import { logger } from "@/lib/logger";
import { auth as clientAuth, db as firestoreDb } from "@/lib/firebase"; // renamed to avoid conflict
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDocs, collection, updateDoc, deleteDoc, query, where, addDoc } from "firebase/firestore";
import { getAuthenticatedUser } from "@/lib/firebase-admin";


const mapYlyticToInfluencer = (ylyticData: YlyticInfluencer[]): Influencer[] => {
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
  
  const user = await getAuthenticatedUser();
  if (!user) {
    return { error: "Authentication required to search." };
  }

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
    return { data: mappedData };

  } catch (error) {
    logger.error("Fetch Error while searching influencers", { error, params });
    return { error: "Failed to connect to the API. Please check your network connection." };
  }
}

export async function getSuggestions(
  searchTerm: string
): Promise<SuggestSearchTermsOutput | null> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }
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

export async function getCities(): Promise<City[]> {
    const user = await getAuthenticatedUser();
    if (!user) {
        throw new Error("Authentication required.");
    }

    try {
        const citiesCollection = collection(firestoreDb, 'cities');
        const citySnapshot = await getDocs(citiesCollection);
        const cityList = citySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as City[];
        return cityList;
    } catch (error) {
        logger.error("Error fetching cities from Firestore", error);
        throw new Error("Could not fetch cities from the database.");
    }
}


export async function signUpUser(credentials: SignUpCredentials): Promise<{ success: boolean; error?: string }> {
  const { name, email, password } = credentials;
  
  try {
    const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
    const user = userCredential.user;

    await setDoc(doc(firestoreDb, "users", user.uid), {
      id: user.uid,
      name: name,
      email: email,
      role: "user",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    logger.error("SIGNUP ERROR", { code: error.code, message: error.message });
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


export async function fetchAllUsers(): Promise<User[]> {
    const user = await getAuthenticatedUser();
    if (user?.role !== 'admin') {
      throw new Error("Permission Denied");
    }
    try {
        const usersCollection = collection(firestoreDb, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const userList = userSnapshot.docs.map(doc => doc.data() as User);
        return userList;
    } catch (error) {
        logger.error('Failed to fetch all users', error);
        throw new Error('Failed to fetch user list.');
    }
}

export async function updateUserRole(userId: string, role: 'user' | 'admin'): Promise<{ success: boolean, error?: string }> {
    const user = await getAuthenticatedUser();
    if (user?.role !== 'admin') {
      return { success: false, error: "Permission Denied" };
    }
    try {
        const userDocRef = doc(firestoreDb, 'users', userId);
        await updateDoc(userDocRef, { role });
        return { success: true };
    } catch (error) {
        logger.error(`Failed to update role for user ${userId}`, error);
        return { success: false, error: 'Failed to update user role.' };
    }
}

export async function addCity(cityName: string): Promise<{ success: boolean; city?: City; error?: string }> {
    const user = await getAuthenticatedUser();
    if (user?.role !== 'admin') {
      return { success: false, error: "Permission Denied" };
    }
    try {
        const citiesRef = collection(firestoreDb, 'cities');
        
        const q = query(citiesRef, where('name_lowercase', '==', cityName.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, error: 'This city already exists.' };
        }

        const newCityData = { 
            name: cityName,
            name_lowercase: cityName.toLowerCase(), 
            createdAt: serverTimestamp() 
        };
        const newDocRef = await addDoc(citiesRef, newCityData);
        
        const returnedCity: City = {
            id: newDocRef.id,
            name: newCityData.name,
            createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } 
        };

        return { success: true, city: returnedCity };

    } catch(e: any) {
        logger.error("Error adding city to Firestore", { error: e });
        return { success: false, error: 'Database error while adding city.' };
    }
}

export async function deleteCity(cityId: string): Promise<{ success: boolean; error?: string }> {
    const user = await getAuthenticatedUser();
    if (user?.role !== 'admin') {
      return { success: false, error: "Permission Denied" };
    }
    try {
        const cityDocRef = doc(firestoreDb, 'cities', cityId);
        await deleteDoc(cityDocRef);
        return { success: true };
    } catch(e: any) {
        logger.error(`Error deleting city ${cityId}`, { error: e });
        return { success: false, error: 'Database error while deleting city.' };
    }
}
