import { NextResponse } from "next/server";
import { idParamSchema } from "@/lib/validation/requests";
import { updateAddressSchema } from "@/lib/validation/payloads";
import { updateAddress, deleteAddress } from "@/features/addresses/services/addressService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const params = idParamSchema.parse(context.params);
    const body = await request.json();
    const payload = updateAddressSchema.parse(body);

    const userId = body.userId as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const address = await updateAddress({
      id: params.id,
      userId,
      label: payload.label,
      fullName: payload.fullName,
      phone: payload.phone,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2 ?? undefined,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      postalCode: payload.postalCode ?? undefined,
      latitude: payload.latitude,
      longitude: payload.longitude,
      isDefault: payload.isDefault
    });

    return NextResponse.json({ address });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update address" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    const params = idParamSchema.parse(context.params);
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const address = await deleteAddress({ id: params.id, userId });
    return NextResponse.json({ address });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete address" },
      { status: 400 }
    );
  }
}
