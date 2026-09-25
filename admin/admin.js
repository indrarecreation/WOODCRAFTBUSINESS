const BACKEND_URL = "";

async function loadOrders() {

    /*
    Google Apps Script backend
    will be connected here.
    */

    console.log("Loading orders...");

}


function logout() {

    localStorage.removeItem("woodcraft_admin");

    window.location.href = "index.html";

}


loadOrders();
