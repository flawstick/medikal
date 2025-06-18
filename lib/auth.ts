import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { db } from "@/server/db"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          // Check if user exists in accounts table
          const { data: existingUser, error: selectError } = await db
            .from("accounts")
            .select("*")
            .eq("email", profile.email)
            .single()

          if (selectError && selectError.code !== "PGRST116") { // PGRST116 = no rows found
            console.error("Error checking user:", selectError)
            return false
          }

          if (!existingUser) {
            // Create new user
            const { error: insertError } = await db
              .from("accounts")
              .insert({
                email: profile.email,
                provider: "google",
                provider_id: account.providerAccountId,
                is_verified: true,
                last_login: new Date().toISOString(),
              })

            if (insertError) {
              console.error("Error creating user:", insertError)
              return false
            }
          } else {
            // Update last login
            const { error: updateError } = await db
              .from("accounts")
              .update({ 
                last_login: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq("email", profile.email)

            if (updateError) {
              console.error("Error updating user:", updateError)
            }
          }
          
          return true
        } catch (error) {
          console.error("Error during sign in:", error)
          return false
        }
      }
      return true
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