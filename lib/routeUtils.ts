import { geocodeAddress } from "./geocoding";

interface LatLng {
  lat: number;
  lng: number;
}

// Haversine formula to calculate distance between two lat/lng points in meters
function haversineDistance(coords1: LatLng, coords2: LatLng): number {
  const R = 6371e3; // metres
  const φ1 = (coords1.lat * Math.PI) / 180; // φ, λ in radians
  const φ2 = (coords2.lat * Math.PI) / 180;
  const Δφ = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const Δλ = ((coords2.lng - coords1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return d;
}

/**
 * Computes an approximate shortest path using a nearest-neighbor heuristic
 * based on geographical coordinates obtained via geocoding.
 * @param addresses Array of address strings
 * @returns Object with orderedIndices, totalDistance (meters), totalDuration (seconds - estimated based on distance)
 */
export async function computeNearestNeighborRoute(
  addresses: string[],
): Promise<{
  orderedIndices: number[];
  totalDistance: number;
  totalDuration: number;
}> {
  const n = addresses.length;
  if (n === 0) {
    return { orderedIndices: [], totalDistance: 0, totalDuration: 0 };
  }

  // 1. Geocode all addresses
  const coordinates: (LatLng | null)[] = await Promise.all(
    addresses.map((address) => geocodeAddress(address)),
  );

  // Filter out nulls and map back to original indices
  const validPoints: { coord: LatLng; originalIndex: number }[] = [];
  coordinates.forEach((coord, index) => {
    if (coord) {
      validPoints.push({ coord, originalIndex: index });
    } else {
      console.warn(`Could not geocode address: ${addresses[index]}. Skipping.`);
    }
  });

  if (validPoints.length === 0) {
    console.error("No valid addresses to optimize.");
    return { orderedIndices: [], totalDistance: 0, totalDuration: 0 };
  }

  const numValidPoints = validPoints.length;
  const distances: number[][] = Array.from({ length: numValidPoints }, () =>
    Array(numValidPoints).fill(Infinity),
  );

  // 2. Calculate all-pairs distances using Haversine
  for (let i = 0; i < numValidPoints; i++) {
    for (let j = 0; j < numValidPoints; j++) {
      if (i === j) {
        distances[i][j] = 0;
      } else {
        distances[i][j] = haversineDistance(
          validPoints[i].coord,
          validPoints[j].coord,
        );
      }
    }
  }

  // 3. Nearest-neighbor heuristic
  const visited = Array(numValidPoints).fill(false);
  let currentIdxInValidPoints = 0; // Start with the first valid point
  visited[currentIdxInValidPoints] = true;
  const orderedIndicesInValidPoints = [currentIdxInValidPoints];
  let totalDistance = 0;

  for (let step = 1; step < numValidPoints; step++) {
    let nextIdxInValidPoints = -1;
    let bestDist = Infinity;

    for (let j = 0; j < numValidPoints; j++) {
      if (!visited[j] && distances[currentIdxInValidPoints][j] < bestDist) {
        bestDist = distances[currentIdxInValidPoints][j];
        nextIdxInValidPoints = j;
      }
    }

    if (nextIdxInValidPoints === -1) break; // Should not happen if all points are reachable

    visited[nextIdxInValidPoints] = true;
    orderedIndicesInValidPoints.push(nextIdxInValidPoints);
    totalDistance += bestDist;
    currentIdxInValidPoints = nextIdxInValidPoints;
  }

  // Map back to original indices
  const orderedOriginalIndices = orderedIndicesInValidPoints.map(
    (idx) => validPoints[idx].originalIndex,
  );

  // Estimate duration (e.g., 1 minute per 1000 meters, adjust as needed)
  const estimatedSpeedMetersPerSecond = 1000 / 60; // 1 km/min
  const totalDuration = totalDistance / estimatedSpeedMetersPerSecond;

  return { orderedIndices: orderedOriginalIndices, totalDistance, totalDuration };
}