import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUsersDB } from "./src/lib/userDB";
import { signInSchema } from "@/lib/zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Sign In",
      credentials: {
        password: {},
      },
      authorize: async (credentials) => {
        const { password } = await signInSchema.parseAsync(credentials);
        if (typeof password !== 'string') {
          throw new Error("Password must be a string.");
        }
        const user = await getUsersDB({ name: password });
        console.log('Retrieved user:', user);
        if (!user) {
          throw new Error("Invalid credentials.");
        }
        return { id: user[0]._id.toString() };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user_id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user_id = token.user_id as string;
      return session;
    },
  },
});