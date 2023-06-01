const db = require("../config/connection");
const bcrypt = require("bcrypt");
const collection = require("../config/collections");
const collections = require("../config/collections");
const objectId = require("mongodb").ObjectId;

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve) => {
      let userExist = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (!userExist) {
        userData.password = await bcrypt.hash(userData.password, 10);
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            resolve(data);
          });
      } else {
        resolve(false);
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let userDb = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      console.log(userDb, "exist");

      if (userDb) {
        let googleUser = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ email: userDb.email, googleId: { $exists: true } });
        if (googleUser) {
          response.googleUser = true;
          resolve(response);
          return;
        }
        bcrypt
          .compare(userData.password, userDb.password)
          .then((stat) => {
            if (stat) {
              console.log("login successful");

              response.user = userDb;
              response.status = true;
              resolve(response);
            } else {
              //password not match
              response.emailCheck = true;
              response.email = userDb.email;
              response.status = false;
              resolve(response);

              console.log("password doesnt match");
            }
          })
          .catch((err) => {
            console.log(err.message);
            reject(err);
          });
      } else {
        // email is  incorrect
        resolve({ status: false });
        console.log("user not exist check mail");
      }
    });
  },
  confirmPassword: (userPass, userData) => {
    return new Promise(async (resolve) => {
      let userDb = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (userDb) {
        bcrypt.compare(userPass.password, userDb.password).then((stat) => {
          resolve(stat);
        });
      } else {
        resolve(false);
      }
    });
  },
  addToCart: (prodId, userId) => {
    let prodObj = {
      item: new objectId(prodId),
      quantity: 1,
    };
    return new Promise(async (resolve) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: new objectId(userId) });
      if (userCart) {
        let prodExist = userCart.products.findIndex(
          (product) => product.item == prodId
        );
        console.log(prodExist);
        if (prodExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { "products.item": new objectId(prodId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: new objectId(userId) },
              {
                $push: { products: prodObj },
              }
            )
            .then(() => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: new objectId(userId),
          products: [prodObj],
        };

        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then(() => {
            resolve();
          });
      }
    });
  },
  removeFromCart: (prodId, userId) => {
    return new Promise(async (resolve) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { user: new objectId(userId) },

          {
            $pull: { products: { item: new objectId(prodId) } },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  changeQuantity: (userId, proDetail) => {
    return new Promise((resolve) => {
      count = parseInt(proDetail.count);

      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          {
            user: new objectId(userId),
            "products.item": new objectId(proDetail.prodId),
          },
          {
            $inc: { "products.$.quantity": count },
          }
        )
        .then((res) => {
          resolve(res.acknowledged);
        });
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: new objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $addFields: {
              convPrice: { $toInt: "$product.price" },
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: 1,
              amount: { $sum: { $multiply: ["$quantity", "$convPrice"] } },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  updateUserDeatails: (userId, updateDeatail) => {
    return new Promise((resolve) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: new objectId(userId) },
          {
            $set: {
              Name: updateDeatail.Name,
              email: updateDeatail.email,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve) => {
      let cartCount = null;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: new objectId(userId) });
      if (cart) {
        cartCount = cart.products.length;
      }

      resolve(cartCount);
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne(
          { user: new objectId(userId), "products.item": { $exists: true } },
          {}
        );

      if (cartItems) {
        let totalAmount = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { user: new objectId(userId) },
            },
            {
              $unwind: "$products",
            },
            {
              $project: {
                item: "$products.item",
                quantity: "$products.quantity",
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: "item",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $project: {
                item: 1,
                quantity: 1,
                product: { $arrayElemAt: ["$product", 0] },
              },
            },
            {
              $addFields: {
                convPrice: { $toInt: "$product.price" },
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: {
                  $sum: { $multiply: ["$quantity", "$convPrice"] },
                },
                count: { $sum: 1 },
              },
            },
          ])
          .toArray();
        resolve(totalAmount[0].totalAmount);
      } else {
        resolve();
      }
    });
  },
  getCartProductList: (userId) => {
    return new Promise((resolve) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .findOne({
          user: new objectId(userId),
          "products.item": { $exists: true },
        })
        .then((cart) => {
          if (cart) {
            resolve(cart.products);
            return;
          }
          resolve(cart);
        });
    });
  },
  placeOrder: (order, products, total) => {
    return new Promise(async (resolve) => {
      if (order.addressId) {
        var { deliveryDetails } = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne(
            {
              _id: new objectId(order.userId),
              deliveryDetails: {
                $elemMatch: { _id: new objectId(order.addressId) },
              },
            },
            {
              projection: {
                deliveryDetails: { $arrayElemAt: ["$deliveryDetails", 0] },
              },
            }
          );
      } else {
        deliveryDetails = {
          _id: new objectId(),
          address: order.address,
          pincode: order.pincode,
          mobile: order.mobile,
        };
      }
      if (order.addressSave) {
        await db
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: new objectId(order.userId) },
            {
              $push: { deliveryDetails },
            }
          );
      }
      let status = order.paymentMethod == "COD" ? "Placed" : "Pending";
      let payment = order.paymentMethod == "COD" ? "COD" : "Pending";
      let orderObj = {
        user: new objectId(order.userId),
        deliveryDetails,
        grandTotal: total,
        products: products,
        paymentMethod: order.paymentMethod,
        date: new Date().toDateString(),
        status: status,
        payment: payment,
      };

      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          resolve(response.insertedId);
        });
    });
  },
  getOrderProducts: (userId) => {
    return new Promise(async (resolve) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { user: new objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
              details: "$deliveryDetails",
              date: "$date",
              orderStatus: "$status",
              payment: "$payment",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $sort: {
              date: 1,
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
              details: 1,
              date: 1,
              orderStatus: 1,
              payment: 1,
            },
          },
        ])
        .toArray();
      resolve(orders);
    });
  },
  removeCart: (userId) => {
    return new Promise((resolve) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .deleteOne({ user: new objectId(userId) })
        .then(() => {
          resolve();
        });
    });
  },
  updateOrder: (orderId, updateDeatail) => {
    return new Promise((resolve) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: new objectId(orderId) },
          {
            $set: {
              status: updateDeatail.status,
              payment: updateDeatail.payment,
              paymentId: updateDeatail.paymentId,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  cancelOrder: (orderId, prodId) => {
    return new Promise(async (resolve) => {
      let order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ _id: new objectId(orderId) })
        .project({ productSize: { $size: "$products" } })
        .toArray();
      console.log(order, "index");
      console.log(order[0].productSize == 1);
      if (order[0].productSize == 1) {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .deleteOne({ _id: new objectId(orderId) })
          .then(() => {
            resolve();
          });
      } else {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: new objectId(orderId) },
            {
              $pull: { products: { item: new objectId(prodId) } },
            }
          )
          .then(() => {
            resolve();
          });
      }
    });
  },
  getAddress: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USER_COLLECTION)
        .findOne(
          {
            _id: new objectId(userId),
          },
          { projection: { _id: 0, deliveryDetails: 1 } }
        )
        .then(({ deliveryDetails }) => {
          console.log(deliveryDetails, "get add");
          resolve(deliveryDetails);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  },
  addressLength: (userId) => {
    return new Promise((resolve, reject) => {
      console.log(userId);
      db.get()
        .collection(collections.USER_COLLECTION)
        .findOne(
          { _id: new objectId(userId) },
          {
            projection: { length: { $size: "$deliveryDetails" } },
          }
        )
        .then((res) => {
          resolve(res.length);
        });
    });
  },
};
