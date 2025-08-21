import { NextRequest, NextResponse } from "next/server";
import ExifReader from "exifreader";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing image URL", { status: 400 });
  }

  try {
    const r2PublicUrl =
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
      "https://pub-935a9967c0664658862019699749d4f6.r2.dev";
    if (!imageUrl.startsWith(r2PublicUrl)) {
      return new NextResponse("Invalid image URL", { status: 400 });
    }

    const response = await fetch(imageUrl);

    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, {
        status: response.status,
      });
    }

    const imageBuffer = await response.arrayBuffer();

    const tags = ExifReader.load(imageBuffer, { expanded: true });

    const simplifiedTags: any = {};
    if (tags.exif?.DateTimeOriginal) {
      simplifiedTags.dateTimeOriginal = tags.exif.DateTimeOriginal.description;
    }
    if (tags.gps?.Latitude && tags.gps?.Longitude) {
      simplifiedTags.gps = {
        latitude: tags.gps.Latitude,
        longitude: tags.gps.Longitude,
      };
    }

    return NextResponse.json(simplifiedTags);
  } catch (error) {
    console.error("Error reading EXIF data on server:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
