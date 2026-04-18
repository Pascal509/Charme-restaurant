export type AuthUser = {
  id: string;
  email: string | null;
  role: "CUSTOMER" | "ADMIN" | "STAFF" | "VENDOR";
};
