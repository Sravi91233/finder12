
import { db } from './db';
import type { Influencer, City } from '@/types';
import { logger } from './logger';

export function getAllCities(): City[] {
  try {
    const stmt = db.prepare('SELECT * FROM cities ORDER BY name');
    const cities = stmt.all() as City[];
    return cities;
  } catch (error) {
    logger.error('Failed to fetch cities from database', error);
    return [];
  }
}

export function getInfluencersByCity(cityName: string): Influencer[] {
  try {
    const cityStmt = db.prepare('SELECT id FROM cities WHERE name = ?');
    const city = cityStmt.get(cityName) as City | undefined;

    if (!city) {
      return [];
    }

    const creatorsStmt = db.prepare('SELECT * FROM creators WHERE city_id = ?');
    const creators = creatorsStmt.all(city.id) as any[]; // Use any[] and map to be safe
    
    return creators.map(c => ({
        ...c,
        // Ensure numeric types are correct
        followers_count: Number(c.followers_count),
        posts_count: Number(c.posts_count),
        engagement_rate: Number(c.engagement_rate),
    })) as Influencer[];

  } catch (error) {
    logger.error(`Failed to fetch influencers for city: ${cityName}`, error);
    return [];
  }
}

export function saveInfluencers(cityName: string, influencers: Omit<Influencer, 'city_id'>[]): void {
  try {
    // Begin a transaction
    db.transaction(() => {
      // Find or create the city
      let city = db.prepare('SELECT id FROM cities WHERE name = ?').get(cityName) as City | undefined;
      if (!city) {
        const info = db.prepare('INSERT INTO cities (name) VALUES (?)').run(cityName);
        city = { id: info.lastInsertRowid as number, name: cityName };
      }
      const cityId = city.id;

      // Prepare statement for inserting or replacing creators
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO creators (id, city_id, username, full_name, biography, followers_count, posts_count, engagement_rate, connector, location_country, location_city, profile_pic_url, category)
        VALUES (@id, @city_id, @username, @full_name, @biography, @followers_count, @posts_count, @engagement_rate, @connector, @location_country, @location_city, @profile_pic_url, @category)
      `);

      // Insert each influencer
      for (const influencer of influencers) {
        insertStmt.run({
          id: influencer.id,
          city_id: cityId,
          username: influencer.username,
          full_name: influencer.full_name,
          biography: influencer.biography,
          followers_count: influencer.followers_count,
          posts_count: influencer.posts_count,
          engagement_rate: influencer.engagement_rate,
          connector: influencer.connector,
          location_country: influencer.location_country,
          location_city: influencer.location_city,
          profile_pic_url: influencer.profile_pic_url,
          category: influencer.category,
        });
      }
    })(); // Execute the transaction
    logger.info(`Successfully saved ${influencers.length} influencers for city: ${cityName}`);

  } catch (error) {
    logger.error(`Failed to save influencers for city: ${cityName}`, error);
    // Optionally re-throw or handle the error as needed
  }
}

