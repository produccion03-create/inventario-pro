import {
    db,
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "./firebase.js";

const ORIGEN = "AGOSTO_2026_MATERIALES";

const categoriaSelect = document.getElementById("categoria");
const panelRevision = document.getElementById("panelRevision");
const panelPendientes = document.getElementById("panelPendientes");
const contadorRevision = document.getElementById("contadorRevision");

const nombreCategoria = document.getElementById("nombreCategoria");
const progresoRevision = document.getElementById("progresoRevision");
const nombreProducto = document.getElementById("nombreProducto");
const codigoProducto = document.getElementById("codigoProducto");
const materialProducto = document.getElementById("materialProducto");
const descripcionProducto = document.getElementById("descripcionProducto");
const formatoProducto = document.getElementById("formatoProducto");
const proveedorProducto = document.getElementById("proveedorProducto");
const stockSistema = document.getElementById("stockSistema");
const stockFisico = document.getElementById("stockFisico");
const estadoProducto = document.getElementById("estadoProducto");
const marcarRevisado = document.getElementById("marcarRevisado");
const anterior = document.getElementById("anterior");
const siguiente = document.getElementById("siguiente");
const listaPendientesRevision = document.getElementById("listaPendientesRevision");

let productos = [];
let productosCategoria = [];
let indiceActual = 0;

const ahora = new Date();
const mesActual =
    `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function cargarProductos() {
    try {
        const snapshot = await getDocs(collection(db, "productos"));

        productos = snapshot.docs
            .map((d) => ({
                id: d.id,
                ...d.data()
            }))
            .filter((p) =>
                p.revisionStock === true &&
                p.origenExcel === ORIGEN &&
                String(p.formato || "").trim().toLowerCase() !== "plancha"
            );

        cargarCategorias();

    } catch (error) {
        console.error("Error cargando productos:", error);

        categoriaSelect.innerHTML =
            `<option value="">Error cargando categorías</option>`;

        contadorRevision.textContent =
            "No se pudieron cargar los productos.";
    }
}

function cargarCategorias() {
    const categorias = [
        ...new Set(
            productos
                .map((p) => String(p.categoria || "").trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b, "es"));

    categoriaSelect.innerHTML =
        `<option value="">Selecciona una categoría</option>`;

    categorias.forEach((categoria) => {
        const option = document.createElement("option");
        option.value = categoria;
        option.textContent = categoria;
        categoriaSelect.appendChild(option);
    });

    if (!categorias.length) {
        contadorRevision.textContent =
            "Primero ejecuta la actualización del inventario desde Excel.";
    }
}

categoriaSelect.addEventListener("change", async () => {
    const categoria = categoriaSelect.value;

    if (!categoria) {
        panelRevision.style.display = "none";
        panelPendientes.style.display = "none";

        contadorRevision.textContent =
            "Selecciona una categoría para comenzar.";

        return;
    }

    productosCategoria = productos
        .filter((p) => p.categoria === categoria)
        .sort((a, b) =>
            Number(a.excelFila || 99999) - Number(b.excelFila || 99999)
        );

    indiceActual = 0;

    nombreCategoria.textContent = categoria;

    panelRevision.style.display = "block";
    panelPendientes.style.display = "block";

    await mostrarProducto();
});

async function obtenerRevision(producto) {
    const revisionId = `${mesActual}_${producto.id}`;

    return await getDoc(
        doc(db, "revisionesStock", revisionId)
    );
}

async function mostrarProducto() {
    if (!productosCategoria.length) {
        panelRevision.style.display = "none";
        return;
    }

    const producto = productosCategoria[indiceActual];

    nombreProducto.textContent =
        producto.nombre || producto.descripcion || "Producto";

    codigoProducto.textContent =
        producto.codigo || "-";

    materialProducto.textContent =
        producto.material || producto.categoria || "-";

    descripcionProducto.textContent =
        producto.descripcion || "-";

    formatoProducto.textContent =
        producto.formato || "-";

    proveedorProducto.textContent =
        producto.proveedor || "-";

    stockSistema.textContent =
        producto.stock ?? 0;

    progresoRevision.textContent =
        `Producto ${indiceActual + 1} de ${productosCategoria.length}`;

    stockFisico.value = "";

    try {
        const revisionSnapshot = await obtenerRevision(producto);

        if (
            revisionSnapshot.exists() &&
            revisionSnapshot.data().revisado === true
        ) {
            const revision = revisionSnapshot.data();

            stockFisico.value = revision.stockFisico ?? "";

            estadoProducto.textContent =
                "Este producto ya está revisado.";

            estadoProducto.className = "alerta-exito";
            marcarRevisado.textContent = "Guardar revisión";
        } else {
            estadoProducto.textContent =
                "Producto pendiente de revisar.";

            estadoProducto.className = "alerta-info";
            marcarRevisado.textContent = "Marcar como revisado";
        }

    } catch (error) {
        console.error("Error consultando revisión:", error);

        estadoProducto.textContent =
            "No se pudo consultar el estado.";

        estadoProducto.className = "alerta-error";
    }

    anterior.disabled = indiceActual === 0;
    siguiente.disabled =
        indiceActual === productosCategoria.length - 1;

    await mostrarPendientes();
}

marcarRevisado.addEventListener("click", async () => {
    const producto = productosCategoria[indiceActual];

    if (!producto) return;

    if (stockFisico.value === "" || Number(stockFisico.value) < 0) {
        alert("Introduce el stock físico contado.");
        stockFisico.focus();
        return;
    }

    const cantidadFisica = Number(stockFisico.value);
    const revisionId = `${mesActual}_${producto.id}`;

    try {
        await setDoc(
            doc(db, "revisionesStock", revisionId),
            {
                productoId: producto.id,
                codigo: producto.codigo || "",
                nombreProducto: producto.nombre || "",
                categoria: producto.categoria || "",
                material: producto.material || "",
                descripcion: producto.descripcion || "",
                formato: producto.formato || "",
                stockSistema: Number(producto.stock || 0),
                stockFisico: cantidadFisica,
                diferencia:
                    cantidadFisica - Number(producto.stock || 0),
                mes: mesActual,
                revisado: true,
                fechaRevision: serverTimestamp()
            },
            { merge: true }
        );

        estadoProducto.textContent =
            "Producto revisado correctamente.";

        estadoProducto.className = "alerta-exito";
        marcarRevisado.textContent = "Guardar revisión";

        await mostrarPendientes();

    } catch (error) {
        console.error("Error guardando revisión:", error);
        alert("No se pudo guardar la revisión.");
    }
});

anterior.addEventListener("click", async () => {
    if (indiceActual <= 0) return;

    indiceActual--;
    await mostrarProducto();
});

siguiente.addEventListener("click", async () => {
    if (indiceActual >= productosCategoria.length - 1) return;

    indiceActual++;
    await mostrarProducto();
});

async function mostrarPendientes() {
    const pendientes = [];

    for (const producto of productosCategoria) {
        try {
            const revision = await obtenerRevision(producto);

            if (
                !revision.exists() ||
                revision.data().revisado !== true
            ) {
                pendientes.push(producto);
            }
        } catch (error) {
            console.error("Error consultando pendiente:", error);
            pendientes.push(producto);
        }
    }

    contadorRevision.textContent =
        `${pendientes.length} pendiente(s) de ${productosCategoria.length}`;

    contadorRevision.className =
        pendientes.length === 0
            ? "alerta-exito"
            : "alerta-info";

    if (!pendientes.length) {
        listaPendientesRevision.innerHTML = `
            <div class="alerta-exito">
                Todos los productos de esta categoría están revisados.
            </div>
        `;
        return;
    }

    listaPendientesRevision.innerHTML =
        pendientes.map((producto) => `
            <div class="item-pendiente">
                <strong>
                    ${escaparHTML(producto.nombre || producto.descripcion)}
                </strong>

                <span>
                    ${producto.codigo
                        ? `Ref: ${escaparHTML(producto.codigo)} | `
                        : ""
                    }
                    ${escaparHTML(producto.formato || "")}
                    | Stock: ${producto.stock ?? 0}
                </span>
            </div>
        `).join("");
}

cargarProductos();
