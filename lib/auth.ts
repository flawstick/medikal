import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.email === "dev@flawstick.com") {
          return { id: "1", name: "Dev User", email: "dev@flawstick.com" }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "credentials") {
        return true
      }
      return false
    },
    async session({ session, token }) {
      // Add custom session data if needed
      return session
    },
    async jwt({ token, user, account }) {
      // Add custom JWT data if needed
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
