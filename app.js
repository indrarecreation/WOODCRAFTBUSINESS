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
  "https://script.google.com/macros/s/AKfycbwAx9mO8Zp3laWdzDN_MD3b7azHuKWXPX5_KsXrofFxq2nbWoNb-3qB28CZimpnCIsGuA/exechttps://script.google.com/macros/s/AKfycbwAx9mO8Zp3laWdzDN_MD3b7azHuKWXPX5_KsXrofFxq2nbWoNb-3qB28CZimpnCIsGuA/exec";


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
              × ${item.Quantity}
            </div>

            <strong>
              ₹${itemTotal.toFixed(2)}
            </strong>

          </div>

          <button
            onclick="removeFromCart(
              '${escapeHTML(
                item.ProductID
              )}'
            )"
          >
            Remove
          </button>

        </div>

      `;

    }).join("");

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
