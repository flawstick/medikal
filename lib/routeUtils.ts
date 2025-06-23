// lib/routeUtils.ts
// Utility for computing a nearest-neighbor route over a set of addresses.
// Returns the order of indices (0-based) that approximates the shortest path.

/**
 * Given a list of address strings, fetches distances via Google Distance Matrix API
 * and applies a nearest-neighbor heuristic to compute an approximate shortest path.
 * @param points Array of address strings
 * @returns Object with orderedIndices, totalDistance (meters), totalDuration (seconds)
 */
export async function computeNearestNeighborRoute(
  points: string[],
): Promise<{
  orderedIndices: number[];
  totalDistance: number;
  totalDuration: number;
}> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("Google Maps API key not configured");
  const n = points.length;
  // Initialize matrices
  const distances: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));
  const durations: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));

  // Fetch each row
  const fetchRow = async (i: number) => {
    const origin = encodeURIComponent(points[i]);
    const dests = points.map(encodeURIComponent).join("|");
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${dests}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Distance Matrix API HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.status !== "OK") {
      throw new Error(`Distance Matrix API status ${data.status}`);
    }
    const elems = data.rows[0]?.elements;
    if (!Array.isArray(elems) || elems.length !== n) {
      throw new Error("Unexpected Distance Matrix response format");
    }
    elems.forEach((el: any, j: number) => {
      if (el.status === "OK") {
        distances[i][j] = el.distance.value;
        durations[i][j] = el.duration.value;
      }
    });
  };
  // Parallel fetch
  await Promise.all(points.map((_, i) => fetchRow(i)));

  // Nearest-neighbor heuristic
  const visited = Array(n).fill(false);
  let current = 0;
  visited[0] = true;
  const orderedIndices = [0];
  let totalDistance = 0;
  let totalDuration = 0;
  for (let step = 1; step < n; step++) {
    let best = Infinity;
    let nextIdx = -1;
    for (let j = 0; j < n; j++) {
      if (!visited[j] && distances[current][j] < best) {
        best = distances[current][j];
        nextIdx = j;
      }
    }
    if (nextIdx < 0) break;
    visited[nextIdx] = true;
    orderedIndices.push(nextIdx);
    totalDistance += distances[current][nextIdx];
    totalDuration += durations[current][nextIdx];
    current = nextIdx;
  }
  return { orderedIndices, totalDistance, totalDuration };
}