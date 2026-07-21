import {
    db,
    collection,
    getDocs
} from "./firebase.js";

async function cargarDashboard() {

    const productos = await getDocs(collection(db, "productos"));

    let totalProductos = 0;
    let valorAlmacen = 0;
    let stockBajo = 0;

    productos.forEach((documento) => {

        const p = documento.data();

        totalProductos++;

        valorAlmacen += Number(p.stock) * Number(p.precio);

        if (Number(p.stock) < 5) {
            stockBajo++;
        }

    });

    document.getElementById("totalProductos").textContent = totalProductos;

    document.getElementById("valorAlmacen").textContent =
        valorAlmacen.toFixed(2) + " €";

    document.getElementById("stockBajo").textContent = stockBajo;

}

cargarDashboard();