import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/user.model.js";

const signUp = async (req, res) => {
  const { email, password } = req.body;

  try {
    //  email-validation
    z.string().email("Invalid email format").parse(email);

    //  password-validation
    z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(
        /[@$!%*?&]/,
        "Password must contain at least one special character"
      )
      .parse(password);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .send({ message: "User already exists, please log in" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({ email, password: hashedPassword });

    return res
      .status(201)
      .send({ message: "User signed up successfully"});
  } catch (error) {
    console.error("Error during sign up:", error);
    return res
      .status(500)
      .send({ message: "Error during sign up", error: error.message });
  }
};

const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .send({ message: "User not found. Please sign up." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id,email : user.email }, process.env.JWT_SECRET, {
      expiresIn: "1D",
    });

    return res.status(200).send({
      message: "User logged in successfully",
      token,
    });
  } catch (error) {
    console.error("Error during sign in:", error);
    return res
      .status(500)
      .send({ message: "Error during sign in", error: error.message });
  }
};

export { signUp, signIn };
