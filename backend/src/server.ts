import express from "express";
import cors from "cors";
import passport from "./passport-auth/passport";
import authRoutes from "./routes/auth.route";
import projectRoutes from "./routes/project.route";
import errorHandler from "./middleware/error.middleware";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());
app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
