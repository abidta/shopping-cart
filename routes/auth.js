var express = require("express");
var passport = require("passport");
var GoogleStrategy = require("passport-google-oauth20").Strategy;
var router = express.Router();
var db = require("../config/connection");
var collection = require("../config/collections");

function checkLogin(req, res, next) {
  if (req.session.userLoggedIn) {
    console.log("alredy in  a session ");
    res.redirect("/");
  }
  next();
}
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: "/auth/redirect/google",
    },
    async function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      let email = profile._json.email;
      var result = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOneAndUpdate(
          { email: email },
          {
            $setOnInsert: { name: profile._json.name, googleId: profile.id },
          },
          {
            returnOriginal: false,
            upsert: true,
          }
        );
      return cb(null, result.value);
    }
  )
);
router.get(
  "/login/google",
  checkLogin,
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/redirect/google",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  function (req, res) {
    req.session.user = req.session.passport.user;
    req.session.userLoggedIn = true;
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

passport.serializeUser(function (user, cb) {
  console.log(user, "seri");
  process.nextTick(() => {
    cb(null, user);
  });
});

passport.deserializeUser(function (user, cb) {
  console.log(user, "deseri");
  cb(null, user);
});
module.exports = router;
