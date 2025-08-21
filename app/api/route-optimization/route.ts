import { NextRequest, NextResponse } from "next/server";
import { computeNearestNeighborRoute } from "../../../lib/routeUtils";

export const runtime = "edge";

interface RouteOptimizationRequest {
  start: string;
  addresses: string[]; // up to 20 addresses
}

interface RouteOptimizationResponse {
  route: string[]; // Ordered list: start followed by addresses in optimized order
  totalDistance: number; // in meters
  totalDuration: number; // in seconds
}

interface ErrorResponse {
  error: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<RouteOptimizationResponse | ErrorResponse>> {
  try {
    const body = (await request.json()) as RouteOptimizationRequest;
    const { start, addresses } = body;

    // Validate inputs
    if (typeof start !== "string" || !start.trim()) {
      return NextResponse.json(
        { error: "Invalid or missing 'start' address." },
        { status: 400 },
      );
    }
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: "'addresses' must be a non-empty array." },
        { status: 400 },
      );
    }
    if (addresses.length > 20) {
      return NextResponse.json(
        { error: "Maximum of 20 addresses allowed." },
        { status: 400 },
      );
    }

    // Combine start and addresses for optimization
    const allAddresses = [start.trim(), ...addresses.map((a) => a.trim())];

    // Compute the optimized route using the new utility
    const { orderedIndices, totalDistance, totalDuration } =
      await computeNearestNeighborRoute(allAddresses);

    // Map ordered indices back to address strings
    const optimizedRoute = orderedIndices.map((idx) => allAddresses[idx]);

    return NextResponse.json({
      route: optimizedRoute,
      totalDistance,
      totalDuration,
    });
  } catch (err: any) {
    console.error("Route optimization error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
