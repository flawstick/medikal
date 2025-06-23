import { NextRequest, NextResponse } from "next/server";

// Types for request and response
interface RouteOptimizationRequest {
  start: string;
  addresses: string[]; // up to 20 addresses
}

interface RouteOptimizationResponse {
  route: string[];         // Ordered list: start followed by addresses in optimized order
  totalDistance: number;   // in meters
  totalDuration: number;   // in seconds
}

interface ErrorResponse {
  error: string;
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!GOOGLE_API_KEY) {
  console.warn(
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Route optimization will fail."
  );
}

// POST /api/route-optimization
export async function POST(
  request: NextRequest
): Promise<NextResponse<RouteOptimizationResponse | ErrorResponse>> {
  try {
    const body = (await request.json()) as RouteOptimizationRequest;
    const { start, addresses } = body;
    // Validate inputs
    if (typeof start !== "string" || !start.trim()) {
      return NextResponse.json({ error: "Invalid or missing 'start' address." }, { status: 400 });
    }
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json({ error: "'addresses' must be a non-empty array." }, { status: 400 });
    }
    if (addresses.length > 20) {
      return NextResponse.json({ error: "Maximum of 20 addresses allowed." }, { status: 400 });
    }
    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Google API key not configured." }, { status: 500 });
    }

    // Build full list of points: origin plus waypoints
    const points = [start.trim(), ...addresses.map(a => a.trim())];
    const n = points.length;

    // Prepare distance & duration matrices
    const distances: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));
    const durations: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));

    // Helper: fetch distances from one origin to all destinations
    const fetchRow = async (i: number) => {
      const origin = encodeURIComponent(points[i]);
      const dests = points.map(encodeURIComponent).join("|");
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${dests}&key=${GOOGLE_API_KEY}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Distance Matrix API error: ${resp.status}`);
      }
      const data = await resp.json();
      if (data.status !== "OK" || !Array.isArray(data.rows)) {
        throw new Error(`Distance Matrix API status: ${data.status}`);
      }
      const elements = data.rows[0]?.elements;
      if (!Array.isArray(elements) || elements.length !== n) {
        throw new Error("Unexpected Distance Matrix response format.");
      }
      elements.forEach((el: any, j: number) => {
        if (el.status === "OK") {
          distances[i][j] = el.distance.value;
          durations[i][j] = el.duration.value;
        }
      });
    };

    // Fetch all rows sequentially or in parallel
    await Promise.all(points.map((_, i) => fetchRow(i)));

    // Nearest-neighbor TSP heuristic
    const visited = Array(n).fill(false);
    let current = 0;
    visited[0] = true;
    const routeIndices = [0];
    let totalDistance = 0;
    let totalDuration = 0;

    for (let step = 1; step < n; step++) {
      let nextIdx = -1;
      let bestDist = Infinity;
      for (let j = 1; j < n; j++) {
        if (!visited[j] && distances[current][j] < bestDist) {
          bestDist = distances[current][j];
          nextIdx = j;
        }
      }
      if (nextIdx < 0) break;
      visited[nextIdx] = true;
      routeIndices.push(nextIdx);
      totalDistance += distances[current][nextIdx];
      totalDuration += durations[current][nextIdx];
      current = nextIdx;
    }

    // Build optimized route of address strings
    const route = routeIndices.map(idx => points[idx]);
    return NextResponse.json({ route, totalDistance, totalDuration });
  } catch (err: any) {
    console.error("Route optimization error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}