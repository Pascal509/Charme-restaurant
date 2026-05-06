/**
 * Test Helpers
 * 
 * Utilities for making API calls during tests
 */

export const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export async function apiCall<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<{ status: number; data: T; headers: Headers }> {
  const url = `${TEST_BASE_URL}${endpoint}`;
  
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);
  const data = await response.json().catch(() => ({}));

  return {
    status: response.status,
    data,
    headers: response.headers,
  };
}

export async function getMenu() {
  const response = await apiCall<{ categories: Array<{ items: Array<unknown> }> }>('/api/menu');
  // Flatten categories.items into a menu array for easier testing
  const flattenedMenu = response.data.categories?.flatMap(cat => cat.items) || [];
  return {
    ...response,
    data: {
      menu: flattenedMenu,
    },
  };
}

export async function addToCart(payload: {
  guestId?: string;
  userId?: string;
  menuItemId: string;
  productVariantId: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}) {
  return apiCall('/api/cart/add', {
    method: 'POST',
    body: payload,
  });
}

export async function getCart(params: { guestId?: string; userId?: string }) {
  const searchParams = new URLSearchParams();
  if (params.guestId) searchParams.append('guestId', params.guestId);
  if (params.userId) searchParams.append('userId', params.userId);
  
  return apiCall(`/api/cart?${searchParams.toString()}`);
}

export async function clearCart(params: { guestId?: string; userId?: string }) {
  const searchParams = new URLSearchParams();
  if (params.guestId) searchParams.append('guestId', params.guestId);
  if (params.userId) searchParams.append('userId', params.userId);
  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return apiCall(`/api/cart/clear${query}`, {
    method: 'DELETE',
  });
}

export async function removeCartItem(itemId: string, params: { guestId?: string; userId?: string }) {
  return apiCall(`/api/cart/item/${itemId}`, {
    method: 'DELETE',
    body: params,
  });
}

export async function updateCartItemQuantity(
  itemId: string,
  quantity: number,
  params: { guestId?: string; userId?: string }
) {
  return apiCall(`/api/cart/item/${itemId}`, {
    method: 'PUT',
    body: { quantity },
  });
}

export function generateGuestId(): string {
  return `test-guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function checkout(params: { guestId?: string; userId?: string }) {
  return apiCall('/api/checkout', {
    method: 'POST',
    body: params,
  });
}
