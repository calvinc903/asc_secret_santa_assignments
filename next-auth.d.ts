import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user_id?: string;
    name?: string;
  }
  interface User {
    id: string;
  }
}