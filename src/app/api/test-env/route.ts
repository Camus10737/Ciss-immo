import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  });
}