
// =========================
// GOOGLE APPS SCRIPT BACKEND
// =========================

const API_URL = "https://script.google.com/macros/s/AKfycbw7tLFVzQN7SA1azHIK0r1MzudUMrs61c1NVau5b4erDj_YE8yVu09m8DCWr_vik91T/exec";


const products = [
    {
        id: "WC001",
        name: "Handcrafted Lice Comb",
        description: "Fine-tooth natural wooden comb.",
        price: 79,
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: "WC002",
        name: "Premium Wooden Comb",
        description: "Smooth-finished wooden comb.",
        price: 129,
        image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: "WC003",
        name: "Natural Hair Comb",
        description: "Lightweight everyday wooden comb.",
        price: 99,
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
    }
];

let cart = [];


// =========================
// TEST GOOGLE APPS SCRIPT
// =========================

async function testBackend() {

    try {

        const response = await fetch(API_URL);

        const data = await response.json();

        console.log("WOODCRAFT BACKEND:", data);

    } catch (error) {

        console.error(
            "Backend connection failed:",
            error
        );

    }

}

// =========================
// PRODUCT DISPLAY
// =========================

function renderProducts() {

    const grid = document.getElementById("productGrid");

    if (!grid) return;

    grid.innerHTML = products.map(product => `

        <article class="product-card">

            <div class="product-image">
                <img
                    src="${product.image}"
                    alt="${product.name}">
            </div>

            <div class="product-info">

                <h3>${product.name}</h3>

                <p>
                    ${product.description}
                </p>

                <div class="product-price">
                    ₹${product.price}
                </div>

                <button
                    class="add-btn"
                    onclick="addToCart('${product.id}')">

                    Add to Cart

                </button>

            </div>

        </article>

    `).join("");
}


// =========================
// CART
// =========================

function addToCart(productId) {

    const product = products.find(p => p.id === productId);

    if (!product) return;

    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    renderCart();

    openCart();
}


function removeFromCart(productId) {

    cart = cart.filter(item => item.id !== productId);

    renderCart();
}


function changeQuantity(productId, amount) {

    const item = cart.find(item => item.id === productId);

    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    renderCart();
}


function renderCart() {

    const container = document.getElementById("cartItems");

    const count = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    document.getElementById("cartCount").textContent = count;

    if (!cart.length) {

        container.innerHTML = `
            <p class="muted">
                Your cart is empty.
            </p>
        `;

        updateTotals();
        return;
    }

    container.innerHTML = cart.map(item => `

        <div class="cart-item">

            <img src="${item.image}" alt="">

            <div class="cart-item-info">

                <h4>${item.name}</h4>

                <small>
                    ₹${item.price} × ${item.quantity}
                </small>

                <div style="margin-top:8px">

                    <button onclick="changeQuantity('${item.id}', -1)">
                        −
                    </button>

                    <span style="margin:0 10px">
                        ${item.quantity}
                    </span>

                    <button onclick="changeQuantity('${item.id}', 1)">
                        +
                    </button>

                    <button
                        onclick="removeFromCart('${item.id}')"
                        style="margin-left:15px">

                        Remove

                    </button>

                </div>

            </div>

        </div>

    `).join("");

    updateTotals();
}


function updateTotals() {

    const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const delivery = subtotal > 0 ? 50 : 0;

    const discount = 0;

    const total = subtotal - discount + delivery;

    document.getElementById("cartSubtotal").textContent = subtotal;
    document.getElementById("cartDiscount").textContent = discount;
    document.getElementById("cartDelivery").textContent = delivery;
    document.getElementById("cartTotal").textContent = total;
}


// =========================
// CART DRAWER
// =========================

function openCart() {

    document
        .getElementById("cartDrawer")
        .classList.add("active");

}


function closeCart() {

    document
        .getElementById("cartDrawer")
        .classList.remove("active");

}


// =========================
// CHECKOUT
// =========================

function showCheckout() {

    if (!cart.length) {

        alert("Your cart is empty.");

        return;
    }

    closeCart();

    document
        .getElementById("checkoutModal")
        .classList.add("active");
}


function closeCheckout() {

    document
        .getElementById("checkoutModal")
        .classList.remove("active");
}


// =========================
// CHECKOUT FORM
// =========================

document
    .getElementById("checkoutForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        if (!cart.length) {
            alert("Your cart is empty.");
            return;
        }

        /*
        IMPORTANT:

        We do NOT create a PAID order here.

        The backend will:
        1. Recalculate the cart
        2. Validate prices
        3. Create a payment order
        4. Return payment information
        */

        const subtotal = cart.reduce(
            (sum, item) =>
                sum + item.price * item.quantity,
            0
        );

        const delivery = 50;

        const total = subtotal + delivery;

        document.getElementById("payAmount").textContent = total;

        document
            .getElementById("paymentBox")
            .classList.remove("hidden");

        document.getElementById("paymentStatus").textContent =
            "Payment order will be created securely by the server.";

        /*
        Payment gateway integration
        will be added here.
        */

    });


// =========================
// CONTACT LINKS
// =========================

const whatsappNumber = "7356828624";

document.getElementById("whatsappLink").href =
    `https://wa.me/${whatsappNumber}`;

document.getElementById("instagramLink").href =
    "https://instagram.com/";


// =========================
// INITIALIZE
// =========================

renderProducts();
renderCart();
