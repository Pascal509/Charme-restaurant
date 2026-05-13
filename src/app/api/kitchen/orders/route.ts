import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { listKitchenOrders, groupKitchenOrdersByStatus } = await import("@/features/kitchen/services/kitchenService");
  const { getPrimaryRestaurant } = await import("@/features/restaurant/services/restaurantService");
  const url = new URL(request.url);
  const restaurantId = url.searchParams.get("restaurantId");

  const restaurant = restaurantId
    ? { id: restaurantId }
    : await getPrimaryRestaurant();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not configured" }, { status: 400 });
  }

  const orders = await listKitchenOrders(restaurant.id);
  const grouped = groupKitchenOrdersByStatus(orders);

  return NextResponse.json({ orders, grouped });
}
