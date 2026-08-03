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

    filtro.innerHTML = `
        <option value="">
            Todas las categorías
        </option>
    `;

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

    const lista =
    document.getElementById("listaMovimientos");

    lista.innerHTML = "";

    const texto =
    document.getElementById("buscar")
    .value
    .toLowerCase();

    const tipo =
    document.getElementById("filtroTipo").value;

    const categoria =
    document.getElementById("filtroCategoria").value;

    const desde =
    document.getElementById("fechaDesde").value;

    const hasta =
    document.getElementById("fechaHasta").value;

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
        ) return;

        if (
            tipo &&
            m.tipo !== tipo
        ) return;

        if (
            categoria &&
            m.categoria !== categoria
        ) return;

        let fechaObjeto = null;

        if (m.fecha && m.fecha.toDate) {

            fechaObjeto = m.fecha.toDate();

        }

        if (fechaObjeto) {

            if (desde) {

                const fechaDesde =
                new Date(desde);

                if (fechaObjeto < fechaDesde)
                    return;

            }

            if (hasta) {

                const fechaHasta =
                new Date(hasta);

                fechaHasta.setHours(
                    23,
                    59,
                    59,
                    999
                );

                if (fechaObjeto > fechaHasta)
                    return;

            }

        }

        total++;

        if (m.tipo === "Entrada") {

            entradas++;

        } else {

            salidas++;

        }

        const fechaTexto =
        fechaObjeto
        ? fechaObjeto.toLocaleString("es-ES")
        : "Sin fecha";

        const color =
        m.tipo === "Entrada"
        ? "#16a34a"
        : "#dc2626";

        const icono =
        m.tipo === "Entrada"
        ? "📥"
        : "📤";

        lista.innerHTML += `

        <div class="movimiento"
        style="border-left:6px solid ${color};">

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

                <strong>📦 Stock anterior:</strong>

                ${m.stockAnterior}

            </p>

            <p>

                <strong>📦 Stock final:</strong>

                ${m.stockFinal}

            </p>

            <p>

                <strong>🕒 Fecha:</strong>

                ${fechaTexto}

            </p>

        </div>

        `;

    });

    if (total === 0) {

        lista.innerHTML = `

        <div class="panel">

            No hay movimientos.

        </div>

        `;

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

document
.getElementById("fechaDesde")
.addEventListener(
    "change",
    mostrarMovimientos
);

document
.getElementById("fechaHasta")
.addEventListener(
    "change",
    mostrarMovimientos
);

document
.getElementById("limpiarFiltros")
.addEventListener(
    "click",
    () => {

        document.getElementById("buscar").value = "";

        document.getElementById("filtroTipo").value = "";

        document.getElementById("filtroCategoria").value = "";

        document.getElementById("fechaDesde").value = "";

        document.getElementById("fechaHasta").value = "";

        mostrarMovimientos();

    }
);

cargarMovimientos();