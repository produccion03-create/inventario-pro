import {
    db,
    collection,
    getDocs
} from "./firebase.js";

let productos = [];

async function cargarDatos() {

    const datos = await getDocs(collection(db, "productos"));

    let total = 0;
    let valor = 0;
    let bajo = 0;
    let sin = 0;

    productos = [];

    datos.forEach((documento) => {

        const p = documento.data();

        productos.push(p);

        total++;

        valor += Number(p.stock) * Number(p.precio);

        if (Number(p.stock) < 5) {
            bajo++;
        }

        if (Number(p.stock) === 0) {
            sin++;
        }

    });

    document.getElementById("totalProductos").textContent = total;
    document.getElementById("valorAlmacen").textContent = valor.toFixed(2) + " €";
    document.getElementById("stockBajo").textContent = bajo;
    document.getElementById("sinStock").textContent = sin;

}

function exportarCSV() {

    let csv =
        "Código;Nombre;Categoría;Stock;Precio;Valor\n";

    productos.forEach((p) => {

        const valor =
            Number(p.stock) * Number(p.precio);

        csv +=
            `${p.codigo};${p.nombre};${p.categoria};${p.stock};${p.precio};${valor}\n`;

    });

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download = "Inventario.csv";

    enlace.click();

    URL.revokeObjectURL(url);

}

document
    .getElementById("exportarCSV")
    .addEventListener("click", exportarCSV);

cargarDatos();