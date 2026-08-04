import {
    db,
    collection,
    getDocs
} from "./firebase.js";

let pendientes = [];

async function cargarPendientes() {

    const lista = document.getElementById("listaPendientes");

    lista.innerHTML = "Cargando...";

    pendientes = [];

    const datos = await getDocs(
        collection(db, "productos")
    );

    datos.forEach((documento) => {

        const p = documento.data();

        // Ignorar Planchas de EVA
        if (p.categoria === "Planchas de EVA") return;

        const stock = Number(p.stock) || 0;
        const minimo = Number(p.stockMinimo ?? 5);

        if (stock <= minimo) {

            pendientes.push({

                id: documento.id,

                nombre: p.nombre,

                codigo: p.codigo,

                categoria: p.categoria,

                stock: stock,

                minimo: minimo,

                precio: Number(p.precio) || 0

            });

        }

    });

    mostrarPendientes();

}

function mostrarPendientes() {

    const lista = document.getElementById("listaPendientes");

    const texto = document
        .getElementById("buscar")
        .value
        .toLowerCase();

    lista.innerHTML = "";

    let contadorBajo = 0;
    let contadorSinStock = 0;

    pendientes.sort((a, b) => a.stock - b.stock);

    pendientes.forEach((p) => {

        const nombre = p.nombre.toLowerCase();
        const codigo = p.codigo.toLowerCase();

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
            contadorSinStock++;

        } else {

            contadorBajo++;

        }

        lista.innerHTML += `

        <div
        class="movimiento"
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

                ${p.precio.toFixed(2)} €

            </p>

            <p>

                <strong>💵 Valor stock:</strong>

                ${(p.stock * p.precio).toFixed(2)} €

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
        contadorBajo;

    document.getElementById("contadorSinStock").textContent =
        contadorSinStock;

}

document
    .getElementById("buscar")
    .addEventListener("input", mostrarPendientes);

cargarPendientes();