#!/usr/bin/env node
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const bcrypt = require("bcrypt");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;

const url = process.env.MONGO_URI;
console.log(process.env.MONGO_URI);
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const dbName = process.env.DB_NAME;
const collectionName = "admin";

async function main() {
  client
    .connect()
    .then(() => console.log("conected to database"))
    .catch((err) => console.error(err));

  const db = client.db(dbName);
  const adminCollection = db.collection(collectionName);

  const hashPassword = async (password) => {
    try {
      let hahedPassword = await bcrypt.hash(password, 10);
      return hahedPassword;
    } catch (error) {
      console.log(error);
    }
  };
  const adminDocument = {
    email: argv?.admin,
    password: await hashPassword(argv?.pass),
  };

  adminCollection
    .insertOne(adminDocument)
    .then((result) => console.log("admin created successfully", result))
    .catch((err) => console.error(err))
    .finally(() => client.close());
}

main();
