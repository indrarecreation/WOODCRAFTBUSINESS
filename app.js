/*
 * ============================================================
 * WOODCRAFT CUSTOMER WEBSITE
 * ============================================================
 *
 * Product display:
 * Google Sheets → Apps Script → Website
 *
 * Secure order/payment flow:
 *
 * Website
 *    ↓
 * Apps Script createOrder
 *    ↓
 * Apps Script createRazorpayOrder
 *    ↓
 * Razorpay Checkout
 *    ↓
 * Apps Script verifyRazorpayPayment
 *    ↓
 * Payment PAID
 *    ↓
 * Order CONFIRMED
 *
 * IMPORTANT:
 * Browser prices are NOT trusted by backend.
 * Browser payment success is NOT trusted by backend.
 * ============================================================
 */


/* ============================================================
   BACKEND URL
============================================================ */

const API_URL =
  "https://script.google.com/macros/s/AKfycbwAx9mO8Zp3laWdzDN_MD3b7azHuKWXPX5_KsXrofFxq2nbWoNb-3qB28CZimpnCIsGuA/exec";


/* ============================================================
   STATE
============================================================ */

let products = [];

let cart = [];


/* ============================================================
   START
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadProducts();

    renderCart();

  }
);


/* ============================================================
   LOAD PRODUCTS
============================================================ */

async function loadProducts() {

  const productsGrid =
    document.getElementById(
      "productsGrid"
    );

  try {

    const response =
      await fetch(
        API_URL +
        "?action=getProducts",
        {
          method: "GET",
          redirect: "follow",
          credentials: "omit",
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        "Backend error: " +
        response.status
      );

    }


    const data =
      await readJsonResponse(response);


    if (!data.success) {

      throw new Error(
        data.error ||
        "Unable to load products"
      );

    }


    products =
      Array.isArray(data.products)
        ? data.products
        : [];


    renderProducts();


  } catch (error) {

    console.error(
      "PRODUCT ERROR:",
      error
    );


    productsGrid.innerHTML = `
      <div class="loading">
        Products could not be loaded.
      </div>
    `;

  }

}


/* ============================================================
   RENDER PRODUCTS
============================================================ */

function renderProducts() {

  const productsGrid =
    document.getElementById(
      "productsGrid"
    );


  if (!products.length) {

    productsGrid.innerHTML = `
      <div class="loading">
        No products available.
      </div>
    `;

    return;

  }


  productsGrid.innerHTML =
    products.map(product => {

      const productId =
        escapeHTML(
          product.ProductID
        );


      const productName =
        escapeHTML(
          product.ProductName
        );


      const description =
        escapeHTML(
          product.Description || ""
        );


      const image =
        product.ImageURL
          ? escapeHTML(
              product.ImageURL
            )
          : "https://via.placeholder.com/600x600?text=WOODCRAFT";


      const price =
        Number(product.Price) || 0;


      const offerPrice =
        Number(product.OfferPrice) > 0
          ? Number(product.OfferPrice)
          : price;


      return `

        <article class="product-card">

          <img
            class="product-image"
            src="${image}"
            alt="${productName}"
          >

          <div class="product-info">

            <h3>
              ${productName}
            </h3>

            <p class="product-description">
              ${description}
            </p>

            <div class="product-price">

              <span class="offer-price">
                ₹${offerPrice.toFixed(2)}
              </span>

              ${
                offerPrice < price
                  ? `
                    <span class="original-price">
                      ₹${price.toFixed(2)}
                    </span>
                  `
                  : ""
              }

            </div>

            <button
              class="add-cart-button"
              onclick="addToCart('${productId}')"
            >
              Add to Cart
            </button>

          </div>

        </article>

      `;

    }).join("");

}


/* ============================================================
   ADD TO CART
============================================================ */

function addToCart(productId) {

  const product =
    products.find(
      item =>
        String(item.ProductID) ===
        String(productId)
    );


  if (!product) {
    return;
  }


  const existing =
    cart.find(
      item =>
        String(item.ProductID) ===
        String(productId)
    );


  if (existing) {

    existing.Quantity += 1;

  } else {

    cart.push({

      ProductID:
        product.ProductID,

      ProductName:
        product.ProductName,

      Price:
        getProductSellingPrice(
          product
        ),

      Quantity: 1

    });

  }


  renderCart();

  openCart();

}


/* ============================================================
   REMOVE FROM CART
============================================================ */

function removeFromCart(productId) {

  cart =
    cart.filter(
      item =>
        String(item.ProductID) !==
        String(productId)
    );


  renderCart();

}


/* ============================================================
   RENDER CART
============================================================ */
function renderCart() {

  const cartItems =
    document.getElementById(
      "cartItems"
    );

  const cartCount =
    document.getElementById(
      "cartCount"
    );

  const cartTotal =
    document.getElementById(
      "cartTotal"
    );

  const checkoutButton =
    document.getElementById(
      "checkoutButton"
    );


  const totalQuantity =
    cart.reduce(
      (sum, item) =>
        sum + item.Quantity,
      0
    );


  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        (
          item.Price *
          item.Quantity
        ),
      0
    );


  cartCount.textContent =
    totalQuantity;


  cartTotal.textContent =
    `₹${total.toFixed(2)}`;


  checkoutButton.disabled =
    cart.length === 0;


  if (!cart.length) {

    cartItems.innerHTML =
      `<p>Your cart is empty.</p>`;

    return;

  }


  cartItems.innerHTML =
    cart.map(item => {

      const itemTotal =
        item.Price *
        item.Quantity;


      return `

        <div class="cart-item">

          <div>

            <strong>
              ${escapeHTML(
                item.ProductName
              )}
            </strong>

            <div>
              ₹${item.Price.toFixed(2)}
            </div>

            <div class="cart-quantity-controls">

              <button
                type="button"
                onclick="decreaseCartQuantity('${escapeHTML(item.ProductID)}')"
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span>
                ${item.Quantity}
              </span>

              <button
                type="button"
                onclick="increaseCartQuantity('${escapeHTML(item.ProductID)}')"
                aria-label="Increase quantity"
              >
                +
              </button>

            </div>

            <strong>
              ₹${itemTotal.toFixed(2)}
            </strong>

          </div>

          <button
            type="button"
            onclick="removeFromCart('${escapeHTML(item.ProductID)}')"
          >
            Remove
          </button>

        </div>

      `;

    }).join("");

}
/* ============================================================
   INCREASE CART QUANTITY
============================================================ */

function increaseCartQuantity(productId) {

  const item =
    cart.find(
      item =>
        String(item.ProductID) ===
        String(productId)
    );


  if (!item) {
    return;
  }


  item.Quantity += 1;


  renderCart();

}


/* ============================================================
   DECREASE CART QUANTITY
============================================================ */

function decreaseCartQuantity(productId) {

  const item =
    cart.find(
      item =>
        String(item.ProductID) ===
        String(productId)
    );


  if (!item) {
    return;
  }


  item.Quantity -= 1;


  /* --------------------------------------------------------
     REMOVE ITEM WHEN QUANTITY REACHES ZERO
  -------------------------------------------------------- */

  if (item.Quantity <= 0) {

    cart =
      cart.filter(
        cartItem =>
          String(cartItem.ProductID) !==
          String(productId)
      );

  }


  renderCart();

}


/* ============================================================
   PRODUCT PRICE FOR DISPLAY ONLY
============================================================ */

function getProductSellingPrice(product) {

  const price =
    Number(product.Price) || 0;


  const offerPrice =
    Number(product.OfferPrice) || 0;


  if (
    offerPrice > 0 &&
    offerPrice < price
  ) {

    return offerPrice;

  }


  return price;

}


/* ============================================================
   CART DRAWER
============================================================ */

function openCart() {

  document
    .getElementById(
      "cartDrawer"
    )
    .classList.add("open");


  document
    .getElementById(
      "cartOverlay"
    )
    .classList.add("open");

}


function closeCart() {

  document
    .getElementById(
      "cartDrawer"
    )
    .classList.remove("open");


  document
    .getElementById(
      "cartOverlay"
    )
    .classList.remove("open");

}


/* ============================================================
   OPEN CHECKOUT
============================================================ */

function startCheckout() {

  if (!cart.length) {
    return;
  }


  closeCart();


  updateCheckoutTotal();


  document
    .getElementById(
      "checkoutOverlay"
    )
    .classList.add("open");

}


/* ============================================================
   CLOSE CHECKOUT
============================================================ */

function closeCheckout() {

  document
    .getElementById(
      "checkoutOverlay"
    )
    .classList.remove("open");

}


/* ============================================================
   UPDATE CHECKOUT TOTAL
============================================================ */

function updateCheckoutTotal() {

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        (
          item.Price *
          item.Quantity
        ),
      0
    );


  document
    .getElementById(
      "checkoutTotal"
    )
    .textContent =
      `₹${total.toFixed(2)}`;

}


/* ============================================================
   SAFE JSON RESPONSE READER
============================================================ */

async function readJsonResponse(response) {

  /*
   * Apps Script ContentService responses can be redirected.
   * The fetch request explicitly follows redirects.
   *
   * We read the response as TEXT first instead of directly
   * calling response.json().
   *
   * This gives us a much clearer error if Apps Script returns
   * HTML, an empty response, or another unexpected response.
   */

  const text =
    await response.text();


  if (!text) {

    throw new Error(
      "The server returned an empty response."
    );

  }


  try {

    return JSON.parse(text);

  } catch (parseError) {

    console.error(
      "INVALID SERVER RESPONSE:",
      text
    );

    throw new Error(
      "The server returned an invalid response. " +
      "Please try again."
    );

  }

}


/* ============================================================
   POST JSON TO BACKEND
============================================================ */

async function postToBackend(payload) {

  const response =
    await fetch(
      API_URL,
      {

        method: "POST",

        mode: "cors",

        redirect: "follow",

        credentials: "omit",

        cache: "no-store",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8",
          "Accept":
            "application/json"
        },

        body:
          JSON.stringify(payload)

      }
    );


  if (!response.ok) {

    throw new Error(
      "Backend returned HTTP " +
      response.status
    );

  }


  return await readJsonResponse(
    response
  );

}


/* ============================================================
   SUBMIT ORDER
============================================================ */

async function submitOrder(event) {

  event.preventDefault();


  if (!cart.length) {

    showCheckoutMessage(
      "Your cart is empty."
    );

    return;

  }


  const button =
    document.getElementById(
      "placeOrderButton"
    );


  button.disabled = true;

  button.textContent =
    "Creating Order...";


  showCheckoutMessage("");


  const customer = {

  name:
    document
      .getElementById(
        "customerName"
      )
      .value
      .trim(),

  email:
    document
      .getElementById(
        "customerEmail"
      )
      .value
      .trim(),

  phone:
    document
      .getElementById(
        "customerPhone"
      )
      .value
      .trim(),

    address:
      document
        .getElementById(
          "customerAddress"
        )
        .value
        .trim(),

    postOffice:
      document
        .getElementById(
          "customerPostOffice"
        )
        .value
        .trim(),

    pin:
      document
        .getElementById(
          "customerPIN"
        )
        .value
        .trim(),

    district:
      document
        .getElementById(
          "customerDistrict"
        )
        .value
        .trim()

  };


  /*
   * IMPORTANT:
   *
   * Only ProductID + Quantity are sent.
   *
   * Browser price is NOT trusted.
   */

  const items =
    cart.map(item => ({

      ProductID:
        item.ProductID,

      Quantity:
        item.Quantity

    }));


  try {

    /* --------------------------------------------------------
       STEP 1
       CREATE WOODCRAFT ORDER
    -------------------------------------------------------- */

    const data =
      await postToBackend({

        action:
          "createOrder",

        customer:
          customer,

        items:
          items

      });


    if (!data.success) {

      throw new Error(
        data.error ||
        "Order creation failed"
      );

    }


    const orderId =
      data.order.OrderID;


    /* --------------------------------------------------------
       STEP 2
       CREATE RAZORPAY ORDER
    -------------------------------------------------------- */

    button.textContent =
      "Preparing Payment...";


    const razorpayData =
      await postToBackend({

        action:
          "createRazorpayOrder",

        OrderID:
          orderId

      });


    if (!razorpayData.success) {

      throw new Error(
        razorpayData.error ||
        "Unable to create Razorpay order."
      );

    }


    const razorpay =
      razorpayData.razorpay;


    /* --------------------------------------------------------
       STEP 3
       OPEN RAZORPAY CHECKOUT
    -------------------------------------------------------- */

    button.textContent =
      "Opening Payment...";


    if (
      typeof Razorpay ===
      "undefined"
    ) {

      throw new Error(
        "Razorpay Checkout could not be loaded."
      );

    }


    const options = {

      key:
        razorpay.keyId,

      amount:
        razorpay.amount,

      currency:
        razorpay.currency,

      name:
        "WOODCRAFT",

      description:
        "WOODCRAFT Order " +
        orderId,

      order_id:
        razorpay.orderId,


      /* ------------------------------------------------------
         PAYMENT SUCCESS
      ------------------------------------------------------ */

      handler:
        async function(paymentResponse) {

          await verifyPayment(
            orderId,
            paymentResponse
          );

        },


      prefill: {

        name:
          customer.name,

        contact:
          customer.phone

      },


      notes: {

        woodcraftOrderId:
          orderId

      },


      theme: {

        color:
          "#8B5E3C"

      },


      modal: {

        ondismiss:
          function() {

            showCheckoutMessage(
              "Payment window closed. Your order is still pending payment."
            );

            button.disabled = false;

            button.textContent =
              "Continue to Payment";

          }

      }

    };


    const razorpayCheckout =
      new Razorpay(options);


    razorpayCheckout.open();


  } catch (error) {

    console.error(
      "ORDER/PAYMENT ERROR:",
      error
    );


    showCheckoutMessage(
      error.message ||
      "Something went wrong."
    );


    button.disabled = false;

    button.textContent =
      "Continue to Payment";

  }

}


/* ============================================================
   VERIFY PAYMENT
============================================================ */

async function verifyPayment(
  orderId,
  paymentResponse
) {

  const button =
    document.getElementById(
      "placeOrderButton"
    );


  button.disabled = true;

  button.textContent =
    "Verifying Payment...";


  showCheckoutMessage(
    "Payment received. Verifying securely..."
  );


  try {

    /* --------------------------------------------------------
       VALIDATE RAZORPAY RESPONSE
    -------------------------------------------------------- */

    if (
      !paymentResponse ||
      !paymentResponse.razorpay_payment_id ||
      !paymentResponse.razorpay_order_id ||
      !paymentResponse.razorpay_signature
    ) {

      throw new Error(
        "Razorpay returned an incomplete payment response."
      );

    }


    /* --------------------------------------------------------
       SEND RAZORPAY RESPONSE TO SERVER
    -------------------------------------------------------- */

    const data =
      await postToBackend({

        action:
          "verifyRazorpayPayment",

        OrderID:
          orderId,

        razorpay_payment_id:
          paymentResponse
            .razorpay_payment_id,

        razorpay_order_id:
          paymentResponse
            .razorpay_order_id,

        razorpay_signature:
          paymentResponse
            .razorpay_signature

      });


    /* --------------------------------------------------------
       SERVER VERIFICATION FAILED
    -------------------------------------------------------- */

    if (!data.success) {

      throw new Error(
        data.error ||
        "Payment verification failed."
      );

    }


    /* --------------------------------------------------------
       PAYMENT VERIFIED
    -------------------------------------------------------- */

    closeCheckout();


    document
      .getElementById(
        "successOrderId"
      )
      .textContent =
        orderId;


    document
      .getElementById(
        "orderSuccessOverlay"
      )
      .classList.add("open");


    /* --------------------------------------------------------
       CLEAR CART ONLY AFTER VERIFIED PAYMENT
    -------------------------------------------------------- */

    cart = [];

    renderCart();


  } catch (error) {

    console.error(
      "PAYMENT VERIFICATION ERROR:",
      error
    );


    showCheckoutMessage(
      "Payment verification failed. " +
      error.message
    );


    button.disabled = false;

    button.textContent =
      "Continue to Payment";

  }

}


/* ============================================================
   CHECKOUT MESSAGE
============================================================ */

function showCheckoutMessage(message) {

  document
    .getElementById(
      "checkoutMessage"
    )
    .textContent =
      message || "";

}


/* ============================================================
   ORDER SUCCESS CLOSE
============================================================ */

function closeOrderSuccess() {

  document
    .getElementById(
      "orderSuccessOverlay"
    )
    .classList.remove("open");

}


/* ============================================================
   HTML ESCAPE
============================================================ */

function escapeHTML(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}
/* =========================================================
   CUSTOMER ACCOUNT / OTP LOGIN
========================================================= */

let customerSessionToken =
  localStorage.getItem(
    "woodcraftCustomerSession"
  ) || "";

let customerProfile = null;


/* =========================================================
   OPEN ACCOUNT
========================================================= */

async function openAccount() {

  const modal =
    document.getElementById(
      "accountModal"
    );

  if (!modal) {
    return;
  }

  modal.style.display = "flex";

  /* -------------------------------------------------------
     CHECK EXISTING SESSION
  ------------------------------------------------------- */

  if (customerSessionToken) {

    try {

      await loadCustomerAccount();

      return;

    } catch (error) {

      console.log(
        "Stored customer session is invalid."
      );

      customerSessionToken = "";

      localStorage.removeItem(
        "woodcraftCustomerSession"
      );
    }
  }

  showAccountLogin();
}


/* =========================================================
   CLOSE ACCOUNT
========================================================= */

function closeAccount() {

  const modal =
    document.getElementById(
      "accountModal"
    );

  if (modal) {
    modal.style.display = "none";
  }
}


/* =========================================================
   SHOW LOGIN VIEW
========================================================= */

function showAccountLogin() {

  const loginView =
    document.getElementById(
      "accountLoginView"
    );

  const otpView =
    document.getElementById(
      "accountOtpView"
    );

  const profileView =
    document.getElementById(
      "accountProfileView"
    );

  if (loginView) {
    loginView.style.display = "block";
  }

  if (otpView) {
    otpView.style.display = "none";
  }

  if (profileView) {
    profileView.style.display = "none";
  }
}


/* =========================================================
   SHOW OTP VIEW
========================================================= */

function showAccountOTP() {

  const loginView =
    document.getElementById(
      "accountLoginView"
    );

  const otpView =
    document.getElementById(
      "accountOtpView"
    );

  const profileView =
    document.getElementById(
      "accountProfileView"
    );

  if (loginView) {
    loginView.style.display = "none";
  }

  if (otpView) {
    otpView.style.display = "block";
  }

  if (profileView) {
    profileView.style.display = "none";
  }
}


/* =========================================================
   SHOW ACCOUNT PROFILE
========================================================= */

function showAccountProfile() {

  const loginView =
    document.getElementById(
      "accountLoginView"
    );

  const otpView =
    document.getElementById(
      "accountOtpView"
    );

  const profileView =
    document.getElementById(
      "accountProfileView"
    );

  if (loginView) {
    loginView.style.display = "none";
  }

  if (otpView) {
    otpView.style.display = "none";
  }

  if (profileView) {
    profileView.style.display = "block";
  }
}


/* =========================================================
   BACK TO EMAIL
========================================================= */

function backToAccountEmail() {

  const otpInput =
    document.getElementById(
      "accountOtp"
    );

  if (otpInput) {
    otpInput.value = "";
  }

  const message =
    document.getElementById(
      "otpMessage"
    );

  if (message) {
    message.textContent = "";
  }

  showAccountLogin();
}


/* =========================================================
   SEND CUSTOMER OTP
========================================================= */

async function sendCustomerOTP() {

  const emailInput =
    document.getElementById(
      "accountEmail"
    );

  const message =
    document.getElementById(
      "accountMessage"
    );

  const button =
    document.getElementById(
      "sendOtpButton"
    );

  if (!emailInput) {
    return;
  }

  const email =
    emailInput.value
      .trim()
      .toLowerCase();

  if (!email) {

    if (message) {
      message.textContent =
        "Please enter your email address.";
    }

    return;
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {

    if (message) {
      message.textContent =
        "Please enter a valid email address.";
    }

    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Sending...";
  }

  if (message) {
    message.textContent = "";
  }

  try {

    const response =
      await postToBackend({
        action:
          "requestCustomerOTP",

        email:
          email
      });

    if (!response.success) {
      throw new Error(
        response.error ||
        "Unable to send OTP."
      );
    }

    if (message) {
      message.textContent =
        "OTP sent. Please check your email.";
    }

    showAccountOTP();

  } catch (error) {

    if (message) {
      message.textContent =
        error.message ||
        "Unable to send OTP.";
    }

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = "Send OTP";
    }
  }
}


/* =========================================================
   VERIFY CUSTOMER LOGIN
========================================================= */

async function verifyCustomerLogin() {

  const emailInput =
    document.getElementById(
      "accountEmail"
    );

  const otpInput =
    document.getElementById(
      "accountOtp"
    );

  const message =
    document.getElementById(
      "otpMessage"
    );

  const button =
    document.getElementById(
      "verifyOtpButton"
    );

  if (!emailInput || !otpInput) {
    return;
  }

  const email =
    emailInput.value
      .trim()
      .toLowerCase();

  const otp =
    otpInput.value
      .trim();

  if (!/^\d{6}$/.test(otp)) {

    if (message) {
      message.textContent =
        "Please enter the 6-digit OTP.";
    }

    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Verifying...";
  }

  if (message) {
    message.textContent = "";
  }

  try {

    const response =
      await postToBackend({

        action:
          "verifyCustomerOTP",

        email:
          email,

        otp:
          otp

      });

    if (!response.success) {
      throw new Error(
        response.error ||
        "OTP verification failed."
      );
    }

    if (
      !response.sessionToken
    ) {
      throw new Error(
        "Login session was not created."
      );
    }

    /* -----------------------------------------------------
       SAVE SESSION TOKEN
    ----------------------------------------------------- */

    customerSessionToken =
      response.sessionToken;

    localStorage.setItem(
      "woodcraftCustomerSession",
      customerSessionToken
    );

    customerProfile =
      response.customer || null;

    /* -----------------------------------------------------
       LOAD ACCOUNT
    ----------------------------------------------------- */

    await loadCustomerAccount();

  } catch (error) {

    if (message) {
      message.textContent =
        error.message ||
        "OTP verification failed.";
    }

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent =
        "Verify OTP";
    }
  }
}


/* =========================================================
   LOAD CUSTOMER ACCOUNT
========================================================= */

async function loadCustomerAccount() {

  if (!customerSessionToken) {
    throw new Error(
      "No customer session."
    );
  }

  /* -------------------------------------------------------
     VALIDATE SESSION
  ------------------------------------------------------- */

  const sessionResponse =
    await postToBackend({

      action:
        "validateCustomerSession",

      token:
        customerSessionToken

    });

  if (
    !sessionResponse.success
  ) {

    throw new Error(
      sessionResponse.error ||
      "Session is invalid."
    );
  }

  /* -------------------------------------------------------
     LOAD ORDERS
  ------------------------------------------------------- */

  const ordersResponse =
    await postToBackend({

      action:
        "getCustomerOrders",

      token:
        customerSessionToken

    });

  if (
    !ordersResponse.success
  ) {

    throw new Error(
      ordersResponse.error ||
      "Unable to load orders."
    );
  }

  /* -------------------------------------------------------
     CUSTOMER PROFILE
  ------------------------------------------------------- */

  if (
    customerProfile
  ) {

    renderCustomerProfile(
      customerProfile
    );

  } else {

    customerProfile = {

      Email:
        sessionResponse.customer.email

    };

    renderCustomerProfile(
      customerProfile
    );
  }

  /* -------------------------------------------------------
     ORDERS
  ------------------------------------------------------- */

  renderCustomerOrders(
    ordersResponse.orders || []
  );

  showAccountProfile();

  updateAccountButton();
}


/* =========================================================
   RENDER CUSTOMER PROFILE
========================================================= */

function renderCustomerProfile(
  customer
) {

  const container =
    document.getElementById(
      "accountProfile"
    );

  if (!container) {
    return;
  }

  const fields = [

    ["Name", customer.Name],

    ["Email", customer.Email],

    ["Phone", customer.Phone],

    ["Address", customer.Address],

    ["Post Office", customer.PostOffice],

    ["PIN", customer.PIN],

    ["District", customer.District]

  ];

  container.innerHTML =
    fields
      .map(function(field) {

        const label =
          escapeHTML(
            String(field[0])
          );

        const value =
          escapeHTML(
            String(field[1] || "-")
          );

        return `
          <div class="account-profile-row">
            <div class="account-profile-label">
              ${label}
            </div>

            <div class="account-profile-value">
              ${value}
            </div>
          </div>
        `;

      })
      .join("");
}


/* =========================================================
   RENDER CUSTOMER ORDERS
========================================================= */

function renderCustomerOrders(
  orders
) {

  const container =
    document.getElementById(
      "accountOrders"
    );

  if (!container) {
    return;
  }

  if (!orders.length) {

    container.innerHTML =
      "<p>No orders found.</p>";

    return;
  }

  container.innerHTML =
    orders
      .map(function(order) {

        const items =
          (order.Items || [])
            .map(function(item) {

              return `
                <div class="account-order-item">

                  <span>
                    ${escapeHTML(
                      String(
                        item.ProductName || ""
                      )
                    )}
                    ×
                    ${Number(
                      item.Quantity || 0
                    )}
                  </span>

                  <span>
                    ₹${Number(
                      item.Total || 0
                    ).toFixed(2)}
                  </span>

                </div>
              `;

            })
            .join("");


        const createdAt =
          order.CreatedAt
            ? new Date(
                order.CreatedAt
              ).toLocaleDateString(
                "en-IN"
              )
            : "-";
         const updatedAt =
           order.UpdatedAt
             ? new Date(
                 order.UpdatedAt
               ).toLocaleString(
                 "en-IN"
               )
             : "-";

        /* ---------------------------------------------------
           CUSTOMER-FRIENDLY ORDER STATUS
        --------------------------------------------------- */

        const statusMap = {

          CONFIRMED:
            "Order Received",

          PACKED:
            "Packed",

          OUT_FOR_DELIVERY:
            "Out for Delivery",

          DELIVERED:
            "Delivered"

        };


        const rawOrderStatus =
          String(
            order.OrderStatus || ""
          )
            .trim()
            .toUpperCase();


        const customerOrderStatus =
          statusMap[
            rawOrderStatus
          ] ||
          rawOrderStatus ||
          "-";


        return `
          <div class="account-order">

            <div class="account-order-header">

              <div>

                <div class="account-order-id">
                  ${escapeHTML(
                    String(
                      order.OrderID || ""
                    )
                  )}
                </div>

                <div class="account-order-date">
                  ${escapeHTML(
                    createdAt
                  )}
                </div>

              </div>

            </div>


            ${items}


            <div class="account-order-total">
              Total: ₹${Number(
                order.Total || 0
              ).toFixed(2)}
            </div>


            <div class="account-order-status">
              Payment:
              ${escapeHTML(
                String(
                  order.PaymentStatus || "-"
                )
              )}
            </div>


            <div class="account-order-status">
  Order:
  ${escapeHTML(
    customerOrderStatus
  )}
</div>

<div class="account-order-tracking">

  <div class="order-tracking-line">

    <div class="order-tracking-step ${
      rawOrderStatus === "CONFIRMED"
        ? "active"
        : ["PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(rawOrderStatus)
          ? "completed"
          : ""
    }">

      <div class="order-tracking-dot"></div>

      <div>Order Received</div>

    </div>


    <div class="order-tracking-step ${
      ["PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(rawOrderStatus)
        ? rawOrderStatus === "PACKED"
          ? "active"
          : "completed"
        : ""
    }">

      <div class="order-tracking-dot"></div>

      <div>Packed</div>

    </div>


    <div class="order-tracking-step ${
      ["OUT_FOR_DELIVERY", "DELIVERED"].includes(rawOrderStatus)
        ? rawOrderStatus === "OUT_FOR_DELIVERY"
          ? "active"
          : "completed"
        : ""
    }">

      <div class="order-tracking-dot"></div>

      <div>Out for Delivery</div>

    </div>


    <div class="order-tracking-step ${
      rawOrderStatus === "DELIVERED"
        ? "active"
        : ""
    }">

      <div class="order-tracking-dot"></div>

      <div>Delivered</div>

    </div>

  </div>

</div> 
        `;

      })
      .join("");
}


/* =========================================================
   UPDATE ACCOUNT BUTTON
========================================================= */

function updateAccountButton() {

  const button =
    document.getElementById(
      "accountButton"
    );

  if (!button) {
    return;
  }

  if (customerSessionToken) {
    button.textContent =
      "My Account";
  } else {
    button.textContent =
      "My Account";
  }
}


/* =========================================================
   LOGOUT
========================================================= */

function logoutCustomer() {

  customerSessionToken = "";

  customerProfile = null;

  localStorage.removeItem(
    "woodcraftCustomerSession"
  );

  showAccountLogin();

  const emailInput =
    document.getElementById(
      "accountEmail"
    );

  const otpInput =
    document.getElementById(
      "accountOtp"
    );

  const accountMessage =
    document.getElementById(
      "accountMessage"
    );

  const otpMessage =
    document.getElementById(
      "otpMessage"
    );

  if (emailInput) {
    emailInput.value = "";
  }

  if (otpInput) {
    otpInput.value = "";
  }

  if (accountMessage) {
    accountMessage.textContent = "";
  }

  if (otpMessage) {
    otpMessage.textContent = "";
  }
}
