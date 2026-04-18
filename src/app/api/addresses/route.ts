import { NextResponse } from "next/server";
import { createAddressSchema } from "@/lib/validation/payloads";
import { createAddress, listUserAddresses } from "@/features/addresses/services/addressService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = createAddressSchema.parse(body);

    const address = await createAddress({
      userId: payload.userId,
      label: payload.label,
      fullName: payload.fullName,
      phone: payload.phone,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      postalCode: payload.postalCode,
      latitude: payload.latitude,
      longitude: payload.longitude,
      isDefault: payload.isDefault
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create address" },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const addresses = await listUserAddresses(userId);
    return NextResponse.json({ addresses });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load addresses" },
      { status: 400 }
    );
  }
}
