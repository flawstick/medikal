import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.redirect(
    "https://pub-935a9967c0664658862019699749d4f6.r2.dev/medikal.apk",
    302,
  );
}
