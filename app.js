require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var fileUpload = require("express-fileupload");
var db = require("./config/connection");
var session = require("express-session");
var MongoStore = require("connect-mongo");
var passport = require("passport");

var usersRouter = require("./routes/users");
var adminRouter = require("./routes/admin");
var authRouter = require("./routes/auth");

var app = express();
// view engine setup
var hbs = require("express-handlebars");
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials/",
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: "shoppingCart",
    }),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 },
  })
);

app.use(passport.initialize());
app.use(passport.authenticate("session"));

db.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Db connected succefully");
  }
});

app.use("/", usersRouter);
app.use("/admin", adminRouter);
app.use("/auth", authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
app.use(function (req, res, next) {
  next(createError(500));
  console.log("err");
});
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  console.log(err.status);
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
