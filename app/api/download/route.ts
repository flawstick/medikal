import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.redirect(
    "https://pub-935a9967c0664658862019699749d4f6.r2.dev/application-197413f4-d05d-4f6f-abd0-105c2e958fad.apk",
    302,
  );
}
