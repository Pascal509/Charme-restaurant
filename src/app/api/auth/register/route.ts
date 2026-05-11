import { NextResponse } from "next/server";
import { registerPayloadSchema } from "@/lib/validation/payloads";
import { registerUser } from "@/features/auth/services/authService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = registerPayloadSchema.parse(body);

    const user = await registerUser(payload.email, payload.password, payload.name);
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register";
    const friendly = message.toLowerCase().includes("unique")
      ? "Email already registered"
      : "Unable to register right now";

    return NextResponse.json({ error: friendly }, { status: 400 });
  }
}
