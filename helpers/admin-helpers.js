var db = require("../config/connection");
const collection = require("../config/collections");
const bcrypt = require("bcrypt");
const  objectId = require("mongodb").ObjectId;

module.exports = {
  dologin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let adminDb = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ email: adminData.email });
      if (adminDb) {
        bcrypt
          .compare(adminData.password, adminDb.password)
          .then((response) => {
            if (response) {
              resolve({ login: true });
            } else {
              resolve({ login: false });
            }
          });
      } else {
        resolve({ login: false });
      }
    });
  },
  getUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          {
            $project: {
              password: 0,
            },
          },
        ])
        .toArray();
      console.log(users);
      resolve(users);
    });
  },
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orderList = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $unwind: "$products",
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "products.item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $lookup: {
              from: collection.USER_COLLECTION,
              localField: "user",
              foreignField: "_id",
              as: "user",
            },
          },

          {
            $project: {
              user: { $arrayElemAt: ["$user", 0] },
              product: { $arrayElemAt: ["$product", 0] },
              item: "$products.item",
              quantity: "$products.quantity",
              details: "$deliveryDetails",
              grandTotal:"$grandTotal",
              date: "$date",
              orderStatus: "$status",
              method: "$paymentMethod",
              payment: "$payment",
            },
          },
          {
            $project: {
              "user.password": 0,
            },
          },
          {
            $sort: {
              date: -1,
            },
          },
        ])
        .toArray();
      console.log(orderList);
      resolve(orderList);
    });
  },
  getUserInfo: (usereId) => {
    return new Promise(async (resolve, reject) => {
      let userinfo = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find({ _id: new objectId(usereId) })
        .project({ password: 0 })
        .toArray();
      resolve(userinfo);
    });
  },
};
