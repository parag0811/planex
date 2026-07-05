import passport from "passport";
import { Strategy as githubStrategy } from "passport-github2";
import prisma from "../../../db/prisma";

interface GithubProfile {
  id: string;
  username?: string;
  displayName?: string;
  emails?: Array<{ value?: string }>;
  photos?: Array<{ value?: string }>;
}

passport.use(
  new githubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      callbackURL: "/auth/github/callback",
      scope: ["user:email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: GithubProfile,
      done: (error: Error | null, user?: unknown) => void, // callback to finish auth
    ) => {
      try {
        const makeAuthError = (message: string, status: number) => {
          const error = new Error(message) as AppError;
          error.status = status;
          return error;
        };
        const emailObj = profile.emails?.find((e) => (e as any).primary) || profile.emails?.[0];
        const email = emailObj?.value;
        const providerId = profile.id;

        if (!email) {
          return done(makeAuthError("No public or private email found from your GitHub account. Please ensure your email is verified.", 400));
        }

        let user = await prisma.user.findUnique({
          where: {
            email: email,
          },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.username || null,
              avatarUrl: profile.photos?.[0]?.value || null,
              provider: "GITHUB",
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
        } else if (user.provider !== "GITHUB") {
          return done(
            makeAuthError(
              "Email already exists with another social account. Please use the original provider.",
              409,
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
