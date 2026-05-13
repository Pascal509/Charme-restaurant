import type { NextRequest } from "next/server";

type RouteContext = {
	params: {
		nextauth: string[];
	};
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest, context: RouteContext) {
	const NextAuth = (await import("next-auth")).default;
	const { authOptions } = await import("@/lib/auth");
	const handler = NextAuth(authOptions) as (req: NextRequest, context: RouteContext) => Promise<Response>;
	return handler(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
	const NextAuth = (await import("next-auth")).default;
	const { authOptions } = await import("@/lib/auth");
	const handler = NextAuth(authOptions) as (req: NextRequest, context: RouteContext) => Promise<Response>;
	return handler(request, context);
}
