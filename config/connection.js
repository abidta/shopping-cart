const mongoClient = require("mongodb").MongoClient;

const state = {
  db: null,
};

module.exports.connect = function (done) {
  const url = process.env.MONGO_URI;
  const dbname = "shoppingCart";
  mongoClient
    .connect(url)
    .then((client) => {
      state.db = client.db(dbname);

      done();
    })
    .catch((err) => {
      return done(err);
    });
};
module.exports.get = () => {
  return state.db;
};
