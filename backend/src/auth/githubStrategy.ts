import passport from "passport";
import { Strategy as githubStrategy } from "passport-github2";
import prisma from "../db/prisma";

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
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email from github."));
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
              providerId: Number(profile.id) || null,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);
