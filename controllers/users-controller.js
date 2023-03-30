const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const DUMMY_USERS = [
  {
    id: "u1",
    name: "Princy",
    email: "pc@gmail.com",
    password: "test",
  },
];

const getUser = (req, res, next) => {
  res.json({
    users: DUMMY_USERS,
  });
};

const signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError("Invalid Input passed, please checkdata");
  }

  const { name, email, password } = req.body;

  const hasUser = DUMMY_USERS.find((u) => u.email === email);
  if (hasUser) {
    throw new HttpError("Could not create user, email already exists.", 422);
  }

  const createdUser = {
    id: uuidv4(),
    name, // name: name
    email,
    password,
  };

  DUMMY_USERS.push(createdUser);

  res.status(201).json({ user: createdUser });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  const identifiedUser = DUMMY_USERS.find((u) => u.email === email);
  if (!identifiedUser || identifiedUser.password !== password) {
    throw new HttpError(
      "Could not identify user, credentials seem to be wrong.",
      401
    );
  }

  res.json({
    message: "Logged In!",
  });
};
module.exports = {
  getUser,
  signup,
  login,
};
