var express = require("express");
var router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const getProduct = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};
const confirmPass = (req, res, next) => {
  if (req.session.confirmPassStat) {
    next();
  } else {
    res.render("user/confirm-password");
  }
};

/* GET home page. */

router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let titles = {
    userTitle: "Shopping Cart",
  };
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  getProduct.getAllProduct().then((products) => {
    res.render("user/index", { products, titles, user, cartCount });
  });
});
router.get("/login", (req, res) => {
  if (req.session.userLoggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", {
      pasErr: req.session.passwordErr,
      userErr: req.session.userErr,
      emailId: req.session.emailId,
    });
    req.session.userErr = null;
    req.session.passwordErr = null;
    req.session.emailId = null;
  }
});
router.get("/signup", (req, res) => {
  res.render("user/signup");
});
router.post("/signup", (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    if (response) {
      req.session.userLoggedIn = true;
      req.session.user = req.body;
      res.redirect("/");
    } else {
      res.render("user/signup", { userExistErr: "user already exist" });
    }
  });
});
router.post("/login", (req, res) => {
  console.log(req.body);
  userHelpers
    .doLogin(req.body)
    .then((response) => {
      if (response.status) {
        req.session.userLoggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else if (response.emailCheck) {
        req.session.emailId = response.email;
        req.session.passwordErr = "Password is incorrect!";
        res.redirect("/login");
      } else {
        req.session.userErr = response.googleUser
          ? "this is google user, please signin with google"
          : "User doesnt Exist!";
        res.redirect("/login");
      }
    })
    .catch((err) => res.render("error", { message: err.message }));
});
router.get("/logout", (req, res) => {
  req.session.user = null;
  req.session.userLoggedIn = false;
  res.redirect("/");
});
router.get("/add-to-cart/:id", verifyLogin, (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
    console.log("success");
  });
});
router.get("/cart", verifyLogin, async (req, res, next) => {
  let cartItems = await userHelpers.getCartProducts(req.session.user._id);
  cartProd = cartItems;
  res.render("user/cart", { cartProd });
  console.log(cartProd);
});
router.get("/remove-from-cart/:id", verifyLogin, (req, res) => {
  console.log(req.params.id);
  userHelpers.removeFromCart(req.params.id, req.session.user._id).then(() => {
    res.redirect("/cart");
  });
});
router.post("/change-cart-count", (req, res) => {
  console.log(req.body);

  userHelpers
    .changeQuantity(req.session.user._id, req.body)
    .then((resStatus) => {
      if (resStatus) {
        res.json(req.body.count);
      }
    });
});
router.get("/get-total", verifyLogin, (req, res) => {
  userHelpers.getTotalAmount(req.session.user._id).then((total) => {
    res.json(total);
  });
});
router.get("/place-order", verifyLogin, async (req, res) => {
  let address = await userHelpers.getAddress(req.session.user._id);
  console.log(address, "addr");
  userHelpers.getTotalAmount(req.session.user._id).then((total) => {
    if (!total) {
      res.render("user/place-order", {
        noCart: "unable to proceed. cart is empty !",
      });
      return;
    }
    res.render("user/place-order", {
      grandTotal: total,
      user: req.session.user,
      address: address,
    });
  });
});
router.post("/place-order", async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId);
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId);
  req.session.address = req.body;

  if (req.body.paymentMethod === "COD") {
    userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
      userHelpers.removeCart(req.body.userId);
      res.json(req.body.paymentMethod);
    });
  } else {
    res.json("online");
  }
});
router.get("/orders", verifyLogin, (req, res) => {
  userHelpers.getOrderProducts(req.session.user._id).then((orderlist) => {
    res.render("user/orders", { user: req.session.user, order: orderlist });
  });
});
router.get("/checkout", verifyLogin, async (req, res) => {
  let totalPrice = await userHelpers.getTotalAmount(req.session.user._id);
  let orderProducts = await userHelpers.getCartProducts(req.session.user._id);
  res.render("user/checkout", {
    totalPrice,
    orderProducts,
    user: req.session.user._id,
  });
});
const calculatedAmount = async (userId) => {
  let amount = await userHelpers.getTotalAmount(userId);
  //convert to paisa
  return amount * 100;
};
router.post("/create-payment-intent", verifyLogin, async (req, res) => {
  const userId = req.body.userId;
  let products = await userHelpers.getCartProductList(userId);
  if (!products) {
    res.redirect("/cart");
    return;
  }
  let totalPrice = await userHelpers.getTotalAmount(userId);

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: await calculatedAmount(userId),
    currency: "inr",
    automatic_payment_methods: {
      enabled: true,
    },
  });
  let orderId = await userHelpers.placeOrder(
    req.session.address,
    products,
    totalPrice
  );
  await userHelpers.removeCart(userId);
  res.send({
    clientSecret: paymentIntent.client_secret,
    orderId,
  });
});
router.get("/payment-success", async (req, res) => {
  let paymentId = req.query.payment_intent;
  let paymentStatus = req.query.redirect_status;
  let orderId = req.query.orderId;
  console.log(orderId);
  if (paymentStatus == "succeeded") {
    let updateDeatail = {
      paymentId,
      payment: "success",
      status: "placed",
    };
    await userHelpers.updateOrder(orderId, updateDeatail);
  }

  res.render("user/payment-success", { paymentStatus });
});
router.get("/success", (req, res) => {
  res.send("success");
});
router.get("/cancel-order", (req, res) => {
  userHelpers.cancelOrder(req.query.orderId, req.query.prodId).then(() => {
    res.redirect("/orders");
  });
});
router.post("/confirm-password", (req, res) => {
  console.log(req.body);
  userHelpers.confirmPassword(req.body, req.session.user).then((response) => {
    console.log(response);
    if (response) {
      req.session.confirmPassStat = true;
      res.redirect("/update-user-deatails");
    } else {
      res.render("user/confirm-password", { Error: "password is incorrect!" });
    }
  });
});
router.get("/update-user-deatails", verifyLogin, confirmPass, (req, res) => {
  res.render("user/update-user-deatails", { user: req.session.user });
});
router.post("/update-user-deatails", (req, res) => {
  userHelpers.updateUserDeatails(req.session.user._id, req.body).then(() => {
    console.log(req.body);
    res.send("done");
  });
});
router.post("/address-count", (req, res) => {
  console.log("api");
  console.log(req.body);
  userHelpers.addressLength(req.body.userId).then((size) => {
    res.json(size);
  });
});

module.exports = router;
