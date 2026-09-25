/*
 * WOODCRAFT CUSTOMER WEBSITE
 *
 * Products are loaded ONLY from
 * Google Sheets through Apps Script.
 */


// =====================================================
// BACKEND URL
// =====================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbwAx9mO8Zp3laWdzDN_MD3b7azHuKWXPX5_KsXrofFxq2nbWoNb-3qB28CZimpnCIsGuA/exec";


// =====================================================
// APPLICATION STATE
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
    document.getElementById("productsGrid");

  try {

    const url =
      API_URL + "?action=getProducts";


    const response =
      await fetch(url, {
        method: "GET"
      });


    if (!response.ok) {

      throw new Error(
        "Backend HTTP error: " +
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
      "WOODCRAFT PRODUCT ERROR:",
      error
    );


    productsGrid.innerHTML = `
      <div class="loading">

        <strong>
          Products could not be loaded.
        </strong>

        <br><br>

        Please check the Apps Script
        connection.

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
// PRODUCT PRICE
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
// OPEN CART
// =====================================================

function openCart() {

  document
    .getElementById("cartDrawer")
    .classList.add("open");


  document
    .getElementById("cartOverlay")
    .classList.add("open");

}


// =====================================================
// CLOSE CART
// =====================================================

function closeCart() {

  document
    .getElementById("cartDrawer")
    .classList.remove("open");


  document
    .getElementById("cartOverlay")
    .classList.remove("open");

}


// =====================================================
// CHECKOUT
// =====================================================

function startCheckout() {

  if (!cart.length) {
    return;
  }


  alert(
    "Checkout will be connected next."
  );

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
