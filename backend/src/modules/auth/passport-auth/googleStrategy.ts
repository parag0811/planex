import passport from "passport";
import {
  Profile,
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";
import prisma from "../../../db/prisma";
import { normalizeEmailAddress } from "../../../utils/email";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const makeAuthError = (message: string, status: number) => {
          const error = new Error(message) as AppError;
          error.status = status;
          return error;
        };
        const providerId = profile.id;
        const rawEmail = profile.emails?.[0]?.value;

        if (!rawEmail) {
          return done(makeAuthError("No email found from Google", 400));
        }

        const email = normalizeEmailAddress(rawEmail);

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user && rawEmail !== email) {
          user = await prisma.user.findUnique({
            where: { email: rawEmail },
          });
        }

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
            makeAuthError(
              "Email already exists with local account. Please login with email and password.",
              409,
            ),
          );
        } else if (user.provider !== "GOOGLE") {
          return done(
            makeAuthError(
              "Email already exists with another social account. Please use the original provider.",
              409,
            ),
          );
        }

        return done(null, user as unknown as Express.User);
      } catch (error) {
        return done(error instanceof Error ? error : new Error(String(error)));
      }
    },
  ),
);
