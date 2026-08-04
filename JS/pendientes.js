import {
    db,
    collection,
    getDocs
} from "./firebase.js";

let productos = [];

async function cargarPendientes() {

    const datos = await getDocs(
        collection(db, "productos")
    );

    productos = [];

    datos.forEach((documento) => {

        const p = documento.data();

        // Ignorar Planchas de EVA
        if (p.categoria === "Planchas de EVA") return;

        const stock = Number(p.stock) || 0;
        const minimo = Number(p.stockMinimo ?? 5);

        if (stock <= minimo) {

            productos.push({

                ...p,

                stock,
                minimo

            });

        }

    });

    mostrarPendientes();

}

function mostrarPendientes() {

    const lista =
        document.getElementById("listaPendientes");

    const texto =
        document
        .getElementById("buscar")
        .value
        .toLowerCase();

    lista.innerHTML = "";

    let bajo = 0;
    let sinStock = 0;

    productos.sort((a, b) => a.stock - b.stock);

    productos.forEach((p) => {

        const nombre =
            (p.nombre || "").toLowerCase();

        const codigo =
            (p.codigo || "").toLowerCase();

        if (
            !nombre.includes(texto) &&
            !codigo.includes(texto)
        ) {
            return;
        }

        let color = "#f59e0b";
        let estado = "🟠 Stock bajo";

        if (p.stock === 0) {

            color = "#dc2626";
            estado = "🔴 Sin stock";
            sinStock++;

        } else {

            bajo++;

        }

        lista.innerHTML += `

        <div class="movimiento"
        style="border-left:8px solid ${color};">

            <h3>${estado}</h3>

            <h2>${p.nombre}</h2>

            <p>

                <strong>🏷 Código:</strong>

                ${p.codigo}

            </p>

            <p>

                <strong>📂 Categoría:</strong>

                ${p.categoria}

            </p>

            <p>

                <strong>📦 Stock:</strong>

                ${p.stock}

            </p>

            <p>

                <strong>⚠ Stock mínimo:</strong>

                ${p.minimo}

            </p>

            <p>

                <strong>💰 Precio:</strong>

                ${Number(p.precio).toFixed(2)} €

            </p>

            <p>

                <strong>💵 Valor:</strong>

                ${(p.stock * Number(p.precio)).toFixed(2)} €

            </p>

        </div>

        `;

    });

    if (lista.innerHTML === "") {

        lista.innerHTML = `

        <div class="panel">

            ✅ No hay productos pendientes.

        </div>

        `;

    }

    document.getElementById("contadorBajo").textContent =
        bajo;

    document.getElementById("contadorSinStock").textContent =
        sinStock;

}

document
    .getElementById("buscar")
    .addEventListener("input", mostrarPendientes);

cargarPendientes();