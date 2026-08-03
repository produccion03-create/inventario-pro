import {
    db,
    collection,
    getDocs,
    query,
    orderBy
} from "./firebase.js";

let movimientos = [];

async function cargarMovimientos() {

    const consulta = query(
        collection(db, "movimientos"),
        orderBy("fecha", "desc")
    );

    const datos = await getDocs(consulta);

    movimientos = [];

    datos.forEach((documento) => {

        movimientos.push(documento.data());

    });

    cargarCategorias();

    mostrarMovimientos();

}

function cargarCategorias() {

    const filtro = document.getElementById("filtroCategoria");

    let categorias = [];

    movimientos.forEach((m) => {

        if (
            m.categoria &&
            !categorias.includes(m.categoria)
        ) {

            categorias.push(m.categoria);

        }

    });

    categorias.sort();

    categorias.forEach((c) => {

        filtro.innerHTML += `
            <option value="${c}">
                ${c}
            </option>
        `;

    });

}

function mostrarMovimientos() {

    const lista = document.getElementById("listaMovimientos");

    lista.innerHTML = "";

    const texto =
        document
        .getElementById("buscar")
        .value
        .toLowerCase();

    const tipo =
        document
        .getElementById("filtroTipo")
        .value;

    const categoria =
        document
        .getElementById("filtroCategoria")
        .value;

    let entradas = 0;
    let salidas = 0;
    let total = 0;

    movimientos.forEach((m) => {

        const producto =
            (m.producto || "").toLowerCase();

        const codigo =
            (m.codigo || "").toLowerCase();

        if (
            texto &&
            !producto.includes(texto) &&
            !codigo.includes(texto)
        ) {

            return;

        }

        if (
            tipo &&
            m.tipo !== tipo
        ) {

            return;

        }

        if (
            categoria &&
            m.categoria !== categoria
        ) {

            return;

        }

        total++;

        if (m.tipo === "Entrada") {

            entradas++;

        } else {

            salidas++;

        }

        let fecha = "Sin fecha";

        if (m.fecha && m.fecha.toDate) {

            fecha =
            m.fecha
            .toDate()
            .toLocaleString("es-ES");

        }

        const borde =
            m.tipo === "Entrada"
            ? "#16a34a"
            : "#dc2626";

        const icono =
            m.tipo === "Entrada"
            ? "📥"
            : "📤";

        lista.innerHTML += `

        <div class="movimiento"
        style="border-left:6px solid ${borde};">

            <h3>

                ${icono}
                ${m.tipo}

            </h3>

            <p>

                <strong>📦 Producto:</strong>

                ${m.producto}

            </p>

            <p>

                <strong>🏷 Código:</strong>

                ${m.codigo}

            </p>

            <p>

                <strong>📂 Categoría:</strong>

                ${m.categoria}

            </p>

            <p>

                <strong>📊 Cantidad:</strong>

                ${m.cantidad}

            </p>

            <p>

                <strong>📦 Stock final:</strong>

                ${m.stockFinal}

            </p>

            <p>

                <strong>🕒 Fecha:</strong>

                ${fecha}

            </p>

        </div>

        `;

    });

    if (total === 0) {

        lista.innerHTML =
        "No se han encontrado movimientos.";

    }

    document.getElementById("totalEntradas").textContent =
    entradas;

    document.getElementById("totalSalidas").textContent =
    salidas;

    document.getElementById("totalMovimientos").textContent =
    total;

}

document
.getElementById("buscar")
.addEventListener(
    "input",
    mostrarMovimientos
);

document
.getElementById("filtroTipo")
.addEventListener(
    "change",
    mostrarMovimientos
);

document
.getElementById("filtroCategoria")
.addEventListener(
    "change",
    mostrarMovimientos
);

cargarMovimientos();