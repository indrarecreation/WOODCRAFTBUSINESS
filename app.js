/*
 * WOODCRAFT CUSTOMER WEBSITE
 *
 * Product display:
 * Google Sheets → Apps Script → Website
 *
 * Order creation:
 * Website → Apps Script
 *
 * IMPORTANT:
 * Browser prices are NOT trusted by the backend.
 */


// =====================================================
// BACKEND URL
// =====================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbwAx9mO8Zp3laWdzDN_MD3b7azHuKWXPX5_KsXrofFxq2nbWoNb-3qB28CZimpnCIsGuA/exec";


// =====================================================
// STATE
// =====================================================

let products = [];

let cart = [];


// =====================================================
// START
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadProducts();

    renderCart();

  }
);


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

  const productsGrid =
    document.getElementById(
      "productsGrid"
    );


  try {

    const response =
      await fetch(
        API_URL +
        "?action=getProducts"
      );


    if (!response.ok) {

      throw new Error(
        "Backend error: " +
        response.status
      );

    }


    const data =
      await response.json();


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


// =====================================================
// RENDER PRODUCTS
// =====================================================

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


// =====================================================
// ADD TO CART
// =====================================================

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


// =====================================================
// REMOVE FROM CART
// =====================================================

function removeFromCart(productId) {

  cart =
    cart.filter(
      item =>
        String(item.ProductID) !==
        String(productId)
    );


  renderCart();

}


// =====================================================
// RENDER CART
// =====================================================

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


// =====================================================
// PRODUCT PRICE FOR DISPLAY ONLY
// =====================================================

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


// =====================================================
// CART DRAWER
// =====================================================

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


// =====================================================
// OPEN CHECKOUT
// =====================================================

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


// =====================================================
// CLOSE CHECKOUT
// =====================================================

function closeCheckout() {

  document
    .getElementById(
      "checkoutOverlay"
    )
    .classList.remove("open");

}


// =====================================================
// UPDATE CHECKOUT TOTAL
// =====================================================

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


// =====================================================
// SUBMIT ORDER
// =====================================================

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
   * We send ProductID + Quantity.
   *
   * We do NOT trust the browser's price.
   */

  const items =
    cart.map(item => ({

      ProductID:
        item.ProductID,

      Quantity:
        item.Quantity

    }));


  try {

    const response =
      await fetch(
        API_URL,
        {

          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body:
            JSON.stringify({

              action:
                "createOrder",

              customer:
                customer,

              items:
                items

            })

        }
      );


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.error ||
        "Order creation failed"
      );

    }


    /*
     * Order successfully created.
     */

    document
      .getElementById(
        "checkoutOverlay"
      )
      .classList.remove("open");


    document
      .getElementById(
        "successOrderId"
      )
      .textContent =
        data.order.OrderID;


    document
      .getElementById(
        "orderSuccessOverlay"
      )
      .classList.add("open");


    /*
     * Clear cart after server
     * successfully creates order.
     */

    cart = [];

    renderCart();


  } catch (error) {

    console.error(
      "ORDER ERROR:",
      error
    );


    showCheckoutMessage(
      error.message
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "Continue to Payment";

  }

}


// =====================================================
// CHECKOUT MESSAGE
// =====================================================

function showCheckoutMessage(message) {

  document
    .getElementById(
      "checkoutMessage"
    )
    .textContent =
      message || "";

}


// =====================================================
// ORDER SUCCESS CLOSE
// =====================================================

function closeOrderSuccess() {

  document
    .getElementById(
      "orderSuccessOverlay"
    )
    .classList.remove("open");

}


// =====================================================
// HTML ESCAPE
// =====================================================

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
