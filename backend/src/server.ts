import express from "express";
import cors from "cors";
import passport from "./auth/passport"
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import errorHandler from "./middleware/errorMiddleware";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize())
app.use("/api/users", userRoutes);
app.use("/auth", authRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
