const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

// ============================================ getPlaceById ============================================//

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not find a place.", 500);
    return next(error);
  }
  if (!place) {
    const error = new HttpError( "Could not find place for the provided id.",404);
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userPlaces;
  try {
    userPlaces = await User.findById(userId).populate("places");
  } catch (error) {
    return next(new HttpError("Something went wrong", 500));
  }
  res.json({
    places: userPlaces,
  });
};

// ============================================ createPlace ============================================//

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description, address, creator, location } = req.body;
  const createdPlace = new Place({
    title,
    description,
    address,
    location,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/400px-Empire_State_Building_%28aerial_view%29.jpg", // => File Upload module, will be replaced with real image url
    creator,
  });
  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError( "Creating place failed, please try again.", 500);
    return next(error);
  }
  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }
  console.log(user);
  try {
    await createdPlace.save();
    await user.save();
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again.", 500);
    return next(error);
  }
  res.status(201).json({ place: createdPlace });
};


// ============================================ updatePlace ============================================//


const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data.", 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update place.", 500);
    return next(error);
  }

  place.title = title;
  place.description = description;
  try {
    await place.save();
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update place.",500);
    return next(error);
  }
  res.status(200).json({ place: place.toObject({ getters: true }) });
};

// ============================================ deletePlaces ============================================//

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findByIdAndDelete(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError("Something went wrong, could not delete place.", 500 );
    return next(error);
  }
  if (!place) {
    const error = new HttpError("Could not find place for this id.", 404);
    return next(error);
  }
  try {
    place.creator.places.pull(place);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not delete place.",500);
    return next(error);
  }
  res.status(200).json({ message: "Deleted place." });
};

module.exports = {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace,
};
