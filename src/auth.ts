import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Bike } from "@/models/Bike";
import type { Types } from "mongoose";
import { authConfig } from "@/auth.config";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function ensureDefaultBike(userId: Types.ObjectId | string) {
  const existing = await Bike.findOne({ userId });
  if (existing) return;
  await Bike.create({
    userId,
    bikeName: "BlackPearl",
    bikeModel: "Apache RTR 160 4V",
    brand: "TVS",
    color: "Black",
    tankCapacity: 12,
    fuelType: "Petrol",
    currentOdometer: 0,
    isDefault: true,
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Guest login: no credentials needed, just creates/reuses a demo account.
    Credentials({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize() {
        await connectDB();
        const guestEmail = "guest@blackpearl.app";
        let user = await User.findOne({ email: guestEmail });
        if (!user) {
          user = await User.create({ name: "Guest Rider", email: guestEmail });
        }
        await ensureDefaultBike(user._id);
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      // Ensure a User document (and a default BlackPearl bike) exists on first login.
      await connectDB();
      if (!user.email) return false;

      let dbUser = await User.findOne({ email: user.email });
      if (!dbUser) {
        const role = ADMIN_EMAILS.includes(user.email.toLowerCase()) ? "admin" : "user";
        dbUser = await User.create({
          name: user.name ?? "Rider",
          email: user.email,
          image: user.image ?? undefined,
          role,
        });
      } else if (ADMIN_EMAILS.includes(dbUser.email.toLowerCase()) && dbUser.role !== "admin") {
        // Promote if the email was added to ADMIN_EMAILS after the account existed.
        dbUser.role = "admin";
        await dbUser.save();
      }

      await ensureDefaultBike(dbUser._id);
      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.userId = dbUser._id.toString();
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as typeof session.user & { id: string; role?: string }).id =
          token.userId as string;
        (session.user as typeof session.user & { id: string; role?: string }).role =
          (token.role as string) ?? "user";
      }
      return session;
    },
  },
});
