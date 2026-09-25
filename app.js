// ==========================================
// WOODCRAFT - APP.JS
// ==========================================

// 🔴 PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
const API_URL = "https://script.google.com/macros/s/AKfycbw7tLFVzQN7SA1azHIK0r1MzudUMrs61c1NVau5b4erDj_YE8yVu09m8DCWr_vik91T/exec";


// ==========================================
// CART
// ==========================================

let cart = [];


// ==========================================
// PRODUCTS
// ==========================================

let products = [];


// ==========================================
// LOAD PRODUCTS FROM GOOGLE SHEETS
// ==========================================

async function loadProducts() {

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify({
                action: "getProducts"
            })

        });


        const data = await response.json();


        if (!data.success) {
            throw new Error(data.error || "Failed to load products");
        }


        products = data.products || [];


        renderProducts();

    } catch (error) {

        console.error("Product loading error:", error);

        const productGrid = document.getElementById("productGrid");

        if (productGrid) {

            productGrid.innerHTML = `
                <p style="text-align:center;">
                    Unable to load products right now.
                    Please try again later.
                </p>
            `;

        }

    }

}


// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function renderProducts() {

    const productGrid = document.getElementById("productGrid");

    if (!productGrid) return;


    if (products.length === 0) {

        productGrid.innerHTML = `
            <p>No products available.</p>
        `;

        return;

    }


    productGrid.innerHTML = products.map(product => `

        <article class="product-card">

            <div class="product-image">

                <img
                    src="${product.image || ''}"
                    alt="${product.name}"
                >

            </div>


            <div class="product-info">

                <h3>${product.name}</h3>

                <p>${product.description || ''}</p>


                <div class="product-price">

                    <span class="current-price">
                        ₹${product.price}
                    </span>

                    ${
                        product.originalPrice &&
                        product.originalPrice > product.price
                        ?
                        `<span class="old-price">
                            ₹${product.originalPrice}
                        </span>`
                        :
                        ''
                    }

                </div>


                <button
                    class="add-btn"
                    onclick="addToCart('${product.id}')"
                >
                    ADD TO CART
                </button>

            </div>

        </article>

    `).join("");

}


// ==========================================
// ADD TO CART
// ==========================================

function addToCart(productId) {

    const product = products.find(
        p => String(p.id) === String(productId)
    );


    if (!product) {

        alert("Product not found.");

        return;

    }


    const existing = cart.find(
        item => String(item.id) === String(productId)
    );


    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({

            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            quantity: 1

        });

    }


    renderCart();

    openCart();

}


// ==========================================
// REMOVE FROM CART
// ==========================================

function removeFromCart(productId) {

    cart = cart.filter(
        item => String(item.id) !== String(productId)
    );


    renderCart();

}


// ==========================================
// CHANGE QUANTITY
// ==========================================

function changeQuantity(productId, change) {

    const item = cart.find(
        item => String(item.id) === String(productId)
    );


    if (!item) return;


    item.quantity += change;


    if (item.quantity <= 0) {

        removeFromCart(productId);

        return;

    }


    renderCart();

}


// ==========================================
// RENDER CART
// ==========================================

function renderCart() {

    const cartItems = document.getElementById("cartItems");

    const cartCount = document.getElementById("cartCount");


    if (!cartItems) return;


    if (cart.length === 0) {

        cartItems.innerHTML = `
            <p class="empty-cart">
                Your cart is empty.
            </p>
        `;

    } else {

        cartItems.innerHTML = cart.map(item => `

            <div class="cart-item">

                <img
                    src="${item.image || ''}"
                    alt="${item.name}"
                >


                <div class="cart-item-info">

                    <h4>${item.name}</h4>

                    <p>₹${item.price}</p>


                    <div class="quantity-controls">

                        <button
                            onclick="changeQuantity('${item.id}', -1)"
                        >
                            −
                        </button>


                        <span>
                            ${item.quantity}
                        </span>


                        <button
                            onclick="changeQuantity('${item.id}', 1)"
                        >
                            +
                        </button>

                    </div>

                </div>


                <button
                    class="remove-btn"
                    onclick="removeFromCart('${item.id}')"
                >
                    ×
                </button>

            </div>

        `).join("");

    }


    if (cartCount) {

        const count = cart.reduce(
            (total, item) => total + item.quantity,
            0
        );

        cartCount.textContent = count;

    }


    updateTotals();

}


// ==========================================
// UPDATE TOTALS
// ==========================================

function updateTotals() {

    const subtotalElement =
        document.getElementById("cartSubtotal");

    const deliveryElement =
        document.getElementById("cartDelivery");

    const totalElement =
        document.getElementById("cartTotal");


    const subtotal = cart.reduce(

        (total, item) =>
            total + (item.price * item.quantity),

        0

    );


    const delivery = cart.length > 0 ? 50 : 0;


    const total = subtotal + delivery;


    if (subtotalElement) {

        subtotalElement.textContent =
            `₹${subtotal}`;

    }


    if (deliveryElement) {

        deliveryElement.textContent =
            `₹${delivery}`;

    }


    if (totalElement) {

        totalElement.textContent =
            `₹${total}`;

    }

}


// ==========================================
// OPEN CART
// ==========================================

function openCart() {

    const drawer =
        document.getElementById("cartDrawer");

    if (drawer) {

        drawer.classList.add("open");

    }

}


// ==========================================
// CLOSE CART
// ==========================================

function closeCart() {

    const drawer =
        document.getElementById("cartDrawer");

    if (drawer) {

        drawer.classList.remove("open");

    }

}


// ==========================================
// CHECKOUT
// ==========================================

function showCheckout() {

    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;

    }


    closeCart();


    const checkout =
        document.getElementById("checkoutModal");


    if (checkout) {

        checkout.classList.add("open");

    }

}


// ==========================================
// CLOSE CHECKOUT
// ==========================================

function closeCheckout() {

    const checkout =
        document.getElementById("checkoutModal");


    if (checkout) {

        checkout.classList.remove("open");

    }

}


// ==========================================
// PLACE ORDER
// ==========================================

async function placeOrder() {

    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;

    }


    const name =
        document.getElementById("customerName")?.value.trim();


    const phone =
        document.getElementById("customerPhone")?.value.trim();


    const address =
        document.getElementById("customerAddress")?.value.trim();


    const postOffice =
        document.getElementById("postOffice")?.value.trim();


    const pin =
        document.getElementById("customerPIN")?.value.trim();


    const district =
        document.getElementById("customerDistrict")?.value.trim();


    if (!name || !phone || !address || !pin) {

        alert("Please fill all required customer details.");

        return;

    }


    const items = cart.map(item => ({

        productId: item.id,

        quantity: item.quantity

    }));


    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {

                "Content-Type":
                    "text/plain;charset=utf-8"

            },

            body: JSON.stringify({

                action: "createOrder",

                customer: {

                    name: name,

                    phone: phone,

                    address: address,

                    postOffice: postOffice,

                    pin: pin,

                    district: district

                },

                items: items

            })

        });


        const data = await response.json();


        if (!data.success) {

            throw new Error(
                data.error || "Order creation failed."
            );

        }


        console.log("Order created:", data);


        alert(
            "Order created successfully!\n\n" +
            "Order ID: " + data.orderId +
            "\nAmount: ₹" + data.amount +
            "\n\nPayment is required."
        );


        /*
         * IMPORTANT:
         *
         * This does NOT mark the order as PAID.
         *
         * The payment gateway will be connected
         * in the next step.
         */


    } catch (error) {

        console.error("Order error:", error);

        alert(
            "Unable to create order.\n\n" +
            error.message
        );

    }

}


// ==========================================
// INITIAL LOAD
// ==========================================

loadProducts();

renderCart();
