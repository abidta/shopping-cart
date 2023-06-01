var express = require("express");
const adminHelpers = require("../helpers/admin-helpers");
const productHelpers = require("../helpers/product-helpers");
var router = express.Router();

/* GET users listing. */
const verifyAdmin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

router.get("/", verifyAdmin, function (req, res, next) {
  productHelpers.getAllProduct().then((products) => {
    res.render("admin/view-products", { admin: true, products });
  });
});
router.get("/login", (req, res) => {
  if (req.session.adminLoggedIn) {
    res.redirect("/admin");
  } else {
    res.render("admin/login", {
      adminErr: req.session.adminErr,
      adminTitle: "Admin panel",
    });
  }
  req.session.adminErr = null;
});
router.post("/login", (req, res) => {
  adminHelpers.dologin(req.body).then((response) => {
    if (response.login) {
      req.session.adminLoggedIn = true;
      res.redirect("/admin");
    } else {
      req.session.adminErr = "check your email or password";
      res.redirect("/admin/login");
    }
  });
});
router.get("/logout", (req, res) => {
  req.session.adminLoggedIn = false;
  res.redirect("/admin");
});
router.get("/add-products", (req, res, next) => {
  res.render("admin/add-products", { admin: true, adminTitle: "Admin panel" });
});
router.post("/add-products", (req, res, next) => {
  productHelpers.addProduct(req.body, (check, id) => {
    if (check) {
      id = id.insertedId;
      let image = req.files.image;

      image
        .mv("public/images/products/" + id + "_" + ".jpg")
        .then((value) => {
          res.send(
            `successfull <br> <a href="/admin/add-products">Add another product</a>`
          );
          console.log(value);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.log("error");
    }
  });
});
router.get("/edit-product/:id", (req, res) => {
  let prodId = req.params.id;

  productHelpers.getProductDeatails(prodId).then((product) => {
    console.log(product);
    res.render("admin/edit-product", { product });
  });

  console.log(prodId);
});
router.post("/update-product/:id", (req, res) => {
  let prodId = req.params.id;
  let productDeatails = req.body;
  productHelpers.updateProduct(prodId, productDeatails).then((response) => {
    if (response) {
      res.redirect("/admin/");
      if (req.files) {
        let image = req.files.image;
        image
          .mv("public/images/products/" + prodId + "_" + ".jpg")
          .catch((err) => {
            res.send(err);
          });
      }
    } else {
      console.log("something error");
    }
  });
});
router.get("/delete-product", (req, res) => {
  let prodId = req.query.id;
  console.log(prodId);
  productHelpers.deleteProduct(prodId).then((val) => {
    console.log(val);
    res.redirect("/admin/");
  });
});
router.get("/all-users", verifyAdmin, (req, res) => {
  adminHelpers.getUsers().then((usersList) => {
    console.log(usersList);
    res.render("admin/user-list", { usersList, admin: true });
  });
});
router.get("/all-orders", verifyAdmin, (req, res) => {
  adminHelpers.getAllOrders().then((orderList) => {
    res.render("admin/all-orders", { orderList, admin: true });
  });
});
router.get("/user-info", verifyAdmin, (req, res) => {
  let userId = req.query.id;
  adminHelpers.getUserInfo(userId).then((userInfo) => {
    res.render("admin/user-info", { userInfo });
  });
});
router.get("/view-product", verifyAdmin, (req, res) => {
  let prodId = req.query.prodId;
  productHelpers.viewProduct(prodId).then((product) => {
    res.render("admin/show-product", { product });
  });
});

module.exports = router;
