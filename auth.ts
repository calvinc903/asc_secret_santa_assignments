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
        const user = await getUsersDB({ name: password.toLowerCase() });
        console.log('Retrieved user:', user);
        if (!user) {
          throw new Error("Invalid credentials.");
        }
        return { id: user[0]._id.toString(), name: user[0].name };
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
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      let capitalizedName = token.name ? (token.name as string).charAt(0).toUpperCase() + (token.name as string).slice(1) : 'Invalid Name';
      session.name = capitalizedName;
      session.user_id = token.user_id as string;
      console.log(session.name);
      console.log(session.user_id);
      return session;
    },
  },
});