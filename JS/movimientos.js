import {
    db,
    collection,
    getDocs,
    query,
    orderBy
} from "./firebase.js";

let movimientos = [];

// ==========================
// CARGAR MOVIMIENTOS
// ==========================

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

// ==========================
// CATEGORÍAS
// ==========================

function cargarCategorias() {

    const filtro = document.getElementById("filtroCategoria");

    filtro.innerHTML =
        `<option value="">Todas las categorías</option>`;

    const categorias = [];

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

        filtro.innerHTML +=
            `<option value="${c}">${c}</option>`;

    });

}

// ==========================
// FILTROS
// ==========================

function obtenerMovimientosFiltrados() {

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

    const desde =
        document
        .getElementById("fechaDesde").value;

    const hasta =
        document
        .getElementById("fechaHasta").value;

    return movimientos.filter((m) => {

        const producto =
            (m.producto || "").toLowerCase();

        const codigo =
            (m.codigo || "").toLowerCase();

        if (
            texto &&
            !producto.includes(texto) &&
            !codigo.includes(texto)
        ) return false;

        if (tipo && m.tipo !== tipo)
            return false;

        if (
            categoria &&
            m.categoria !== categoria
        ) return false;

        let fecha = null;

        if (
            m.fecha &&
            m.fecha.toDate
        ) {

            fecha = m.fecha.toDate();

        }

        if (fecha) {

            if (desde) {

                const fDesde =
                    new Date(desde);

                if (fecha < fDesde)
                    return false;

            }

            if (hasta) {

                const fHasta =
                    new Date(hasta);

                fHasta.setHours(
                    23,
                    59,
                    59,
                    999
                );

                if (fecha > fHasta)
                    return false;

            }

        }

        return true;

    });

}

// ==========================
// TABLA
// ==========================

function mostrarMovimientos() {

    const lista =
        document.getElementById("listaMovimientos");

    const datos =
        obtenerMovimientosFiltrados();

    let entradas = 0;
    let salidas = 0;

    let tabla = `

<table class="tabla-productos">

<thead>

<tr>

<th>Fecha</th>

<th>Tipo</th>

<th>Código</th>

<th>Producto</th>

<th>Categoría</th>

<th>Cantidad</th>

<th>Stock ant.</th>

<th>Stock final</th>

</tr>

</thead>

<tbody>

`;

    datos.forEach((m) => {

        if (m.tipo === "Entrada")
            entradas++;
        else
            salidas++;

        let fecha = "";

        if (
            m.fecha &&
            m.fecha.toDate
        ) {

            fecha =
                m.fecha
                .toDate()
                .toLocaleString("es-ES");

        }

        const clase =
            m.tipo === "Entrada"
            ? "ok"
            : "sin";

        const icono =
            m.tipo === "Entrada"
            ? "📥"
            : "📤";

        tabla += `

<tr class="${clase}">

<td>${fecha}</td>

<td>${icono} ${m.tipo}</td>

<td>${m.codigo}</td>

<td>${m.producto}</td>

<td>${m.categoria}</td>

<td>${m.cantidad}</td>

<td>${m.stockAnterior}</td>

<td>${m.stockFinal}</td>

</tr>

`;

    });

    tabla += `

</tbody>

</table>

`;

    if (datos.length === 0) {

        lista.innerHTML =
            `<div class="panel">No hay movimientos.</div>`;

    } else {

        lista.innerHTML = tabla;

    }

    document.getElementById("totalEntradas").textContent =
        entradas;

    document.getElementById("totalSalidas").textContent =
        salidas;

    document.getElementById("totalMovimientos").textContent =
        datos.length;

}

// ==========================
// EXPORTAR A EXCEL
// ==========================

function exportarExcel() {

    const datos = obtenerMovimientosFiltrados();

    const excel = [];

    datos.forEach((m) => {

        let fecha = "";

        if (m.fecha && m.fecha.toDate) {

            fecha = m.fecha
                .toDate()
                .toLocaleString("es-ES");

        }

        excel.push({

            Fecha: fecha,
            Tipo: m.tipo,
            Código: m.codigo,
            Producto: m.producto,
            Categoría: m.categoria,
            Cantidad: m.cantidad,
            "Stock anterior": m.stockAnterior,
            "Stock final": m.stockFinal

        });

    });

    const libro = XLSX.utils.book_new();

    const hoja = XLSX.utils.json_to_sheet(excel);

    XLSX.utils.book_append_sheet(
        libro,
        hoja,
        "Movimientos"
    );

    XLSX.writeFile(
        libro,
        "Movimientos.xlsx"
    );

}

// ==========================
// EVENTOS
// ==========================

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

document
.getElementById("exportarExcel")
.addEventListener(
    "click",
    exportarExcel
);

// ==========================
// INICIO
// ==========================

cargarMovimientos();