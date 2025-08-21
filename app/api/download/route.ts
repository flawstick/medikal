import { NextResponse } from 'next/server';

export const runtime = "edge";

export function GET() {
  return NextResponse.redirect(
    'https://medikal-app.s3.il-central-1.amazonaws.com/app-release.apk',
    302
  );
}