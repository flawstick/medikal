import { env } from "process";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface GeocodeResult {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!GOOGLE_API_KEY) {
    console.error("Google Maps API key is not configured.");
    return null;
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Geocoding API HTTP error: ${response.status}`);
      return null;
    }
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else if (data.status === "ZERO_RESULTS") {
      console.warn(`Geocoding API: No results for address: ${address}`);
      return null;
    } else {
      console.error(`Geocoding API error for ${address}: ${data.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching geocoding data for ${address}:`, error);
    return null;
  }
}
