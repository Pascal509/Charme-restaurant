import { NextResponse } from "next/server";

/**
 * Active Promotions Endpoint
 * 
 * Returns currently active promotions for the store
 * In demo/static mode, returns empty list
 */

export async function GET() {
  return NextResponse.json({
    promotions: []
  });
}
