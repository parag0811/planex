import passport from "passport";
import {
  Profile,
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";
import prisma from "../db/prisma";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "/auth/google/callback",
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        const providerId = Number(profile.id);

        if (!email) {
          return done(new Error("No email found from Google"));
        }

        if (Number.isNaN(providerId)) {
          return done(new Error("Invalid Google profile id."));
        }

        let user = await prisma.user.findUnique({
          where: { email: email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.username || null,
              avatarUrl: profile.photos?.[0]?.value || null,
              provider: "GOOGLE",
              providerId,
            },
          });
        } else if (user.password) {
          return done(
            new Error(
              "Email already exists with local account. Please login with email and password.",
            ),
          );
        } else if (user.provider !== "GOOGLE") {
          return done(
            new Error(
              "Email already exists with another social account. Please use the original provider.",
            ),
          );
        }

        return done(null, user);
      } catch (error) {
        return done(error instanceof Error ? error : new Error(String(error)));
      }
    },
  ),
);
