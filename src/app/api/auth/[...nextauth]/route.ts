import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const NextAuth = (await import("next-auth")).default;
	const { authOptions } = await import("@/lib/auth");
	const handler = NextAuth(authOptions) as (req: NextRequest) => Promise<Response>;
	return handler(request);
}

export async function POST(request: NextRequest) {
	const NextAuth = (await import("next-auth")).default;
	const { authOptions } = await import("@/lib/auth");
	const handler = NextAuth(authOptions) as (req: NextRequest) => Promise<Response>;
	return handler(request);
}
