import { NextResponse } from "next/server";
import { idParamSchema } from "@/lib/validation/requests";
import { setDefaultAddressSchema } from "@/lib/validation/payloads";
import { setDefaultAddress } from "@/features/addresses/services/addressService";

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const params = idParamSchema.parse(context.params);
    const body = await request.json();
    const payload = setDefaultAddressSchema.parse(body);

    const address = await setDefaultAddress({
      id: params.id,
      userId: payload.userId
    });

    return NextResponse.json({ address });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to set default address" },
      { status: 400 }
    );
  }
}
