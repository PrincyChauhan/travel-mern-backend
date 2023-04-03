const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const validate = validationResult(req);
  if (!validate.isEmpty()) {
      return next(
          new HttpError(
              "Invalid Inputs passed, Please Provide valid Inputs",
              422
          )
      );
  }
  const { name, email, password } = req.body;
  let user;
  try {
      user = await User.findOne({ email: email });
  } catch (error) {
      return next(new HttpError("Something while getting the user", 500));
  }
  if (user)
      return next(
          new HttpError("This email is already exist. Try to Login", 422)
      );
  let createdUser;
  let hashedPassword;
  try {
      hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
      return next(new HttpError("Error storing User", 500));
  }
  try {
      createdUser = await User.create({
          name,
          email,
          password: hashedPassword,
          image: "https://live.staticflickr.com/7631/26849088292_36fc52ee90_b.jpg",
          places: [],
      });
  } catch (error) {
      return next(new HttpError(error, 500));
  }

  let token;
  try {
      token = jwt.sign(
          { userId: createdUser.id, email: createdUser.email },
          "authentication_web_token",
          { expiresIn: "1h" }
      );
  } catch (error) {
      return next(new HttpError("Error in token creation", 500));
  }

  res.status(200).json({
      user: createdUser.toObject({ getters: true }),
      token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let user;
  try {
      user = await User.findOne({ email: email });
  } catch (error) {
      return next(
          new HttpError("Somwthing went wrong while getting user", 500)
      );
  }
  if (!user) return next(new HttpError("Provide valid email address", 401));

  let isValidPassword = false;
  try {
      isValidPassword = await bcrypt.compare(password, user.password);
  } catch (error) {
      return next(
          new HttpError(
              "Password is incorrect, Please enter Correct Password",
              500
          )
      );
  }

  if (!isValidPassword)
      return next(new HttpError("Password is incorrect", 401));

  let token;
  try {
      token = jwt.sign(
          { userId: user.id, email: user.email },
          "authentication_web_token",
          { expiresIn: "1h" }
      );
  } catch (error) {
      return next(new HttpError("Error in token creation", 500));
  }

  res.status(200).json({
      user: user.toObject({ getters: true }),
      token,
      message: "Succesfully Logged In",
  });
};

module.exports = {
  getUsers,
  signup,
  login,
};
