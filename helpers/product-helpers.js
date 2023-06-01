var db = require("../config/connection");
const collection = require("../config/collections");
const objectId = require("mongodb").ObjectId;

module.exports = {
  addProduct: (product, callback) => {
    console.log(product);
    db.get()
      .collection("products")
      .insertOne(product)
      .then((data) => {
        console.log(data);
        callback(true, data);
      });
  },
  getAllProduct: () => {
    return new Promise(async (resolve, rejct) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      console.log(new objectId(prodId));
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: new objectId(prodId) })
        .then((data) => {
          console.dir({ data });
          resolve(data);
        });
    });
  },
  getProductDeatails: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: new objectId(prodId) })
        .then((product) => {
          resolve(product);
        });
    });
  },
  updateProduct: (prodId, ProdDeatails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: new objectId(prodId) },
          {
            $set: {
              pname: ProdDeatails.pname,
              price: ProdDeatails.price,
              description: ProdDeatails.description,
              category: ProdDeatails.category,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  viewProduct:(prodId)=>{
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:new objectId(prodId)}).then((product)=>{
        resolve(product)
      })
    })
  }
};
