import {
    db,
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "./firebase.js";

const categoriaSelect = document.getElementById("categoria");
const panelRevision = document.getElementById("panelRevision");

const contadorRevision = document.getElementById("contadorRevision");
const nombreCategoria = document.getElementById("nombreCategoria");
const progresoRevision = document.getElementById("progresoRevision");

const nombreProducto = document.getElementById("nombreProducto");
const codigoProducto = document.getElementById("codigoProducto");
const stockSistema = document.getElementById("stockSistema");
const stockFisico = document.getElementById("stockFisico");

const estadoProducto = document.getElementById("estadoProducto");
const marcarRevisado = document.getElementById("marcarRevisado");

const anterior = document.getElementById("anterior");
const siguiente = document.getElementById("siguiente");

const listaPendientesRevision = document.getElementById(
    "listaPendientesRevision"
);

let productos = [];
let productosCategoria = [];
let indiceActual = 0;
let categoriaActual = "";

const mesActual = new Date().toISOString().slice(0, 7);

async function cargarProductos() {
    try {
        const snapshot = await getDocs(collection(db, "productos"));

        productos = snapshot.docs.map((documento) => ({
            id: documento.id,
            ...documento.data()
        }));

        cargarCategorias();

    } catch (error) {
        console.error("Error cargando productos:", error);

        categoriaSelect.innerHTML = `
            <option value="">Error cargando categorías</option>
        `;

        contadorRevision.textContent =
            "No se pudieron cargar los productos.";
    }
}

function cargarCategorias() {
    const categorias = [
        ...new Set(
            productos
                .map((producto) => producto.categoria)
                .filter((categoria) => categoria)
        )
    ].sort((a, b) => a.localeCompare(b));

    categoriaSelect.innerHTML = `
        <option value="">Selecciona una categoría</option>
    `;

    categorias.forEach((categoria) => {
        const option = document.createElement("option");

        option.value = categoria;
        option.textContent = categoria;

        categoriaSelect.appendChild(option);
    });
}

categoriaSelect.addEventListener("change", async () => {
    categoriaActual = categoriaSelect.value;

    if (!categoriaActual) {
        panelRevision.style.display = "none";

        contadorRevision.textContent =
            "Selecciona una categoría para comenzar.";

        listaPendientesRevision.textContent =
            "Selecciona una categoría para ver los productos pendientes.";

        return;
    }

    productosCategoria = productos
        .filter((producto) => producto.categoria === categoriaActual)
        .sort((a, b) =>
            String(a.nombre || "").localeCompare(
                String(b.nombre || "")
            )
        );

    indiceActual = 0;

    nombreCategoria.textContent = categoriaActual;

    panelRevision.style.display = "block";

    await mostrarProducto();
    await mostrarPendientes();
});

async function mostrarProducto() {
    if (!productosCategoria.length) {
        panelRevision.style.display = "none";

        contadorRevision.textContent =
            "Esta categoría no tiene productos.";

        return;
    }

    const producto = productosCategoria[indiceActual];

    nombreProducto.textContent = producto.nombre || "Sin nombre";
    codigoProducto.textContent = producto.codigo || "-";
    stockSistema.textContent = producto.stock ?? 0;

    progresoRevision.textContent =
        `Producto ${indiceActual + 1} de ${productosCategoria.length}`;

    stockFisico.value = "";

    const revisionId = `${mesActual}_${producto.id}`;
    const revisionRef = doc(db, "revisionesStock", revisionId);
    const revisionSnapshot = await getDoc(revisionRef);

    if (revisionSnapshot.exists()) {
        const revision = revisionSnapshot.data();

        if (revision.revisado === true) {
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
    } else {
        estadoProducto.textContent =
            "Producto pendiente de revisar.";

        estadoProducto.className = "alerta-info";

        marcarRevisado.textContent = "Marcar como revisado";
    }

    anterior.disabled = indiceActual === 0;
    siguiente.disabled =
        indiceActual === productosCategoria.length - 1;

    await mostrarPendientes();
}

marcarRevisado.addEventListener("click", async () => {
    const producto = productosCategoria[indiceActual];

    if (!producto) return;

    const cantidadFisica = Number(stockFisico.value);

    if (stockFisico.value === "" || cantidadFisica < 0) {
        alert("Introduce el stock físico contado.");
        stockFisico.focus();
        return;
    }

    try {
        const revisionId = `${mesActual}_${producto.id}`;

        await setDoc(
            doc(db, "revisionesStock", revisionId),
            {
                productoId: producto.id,
                nombreProducto: producto.nombre || "",
                codigo: producto.codigo || "",
                categoria: producto.categoria || "",
                stockSistema: Number(producto.stock || 0),
                stockFisico: cantidadFisica,
                mes: mesActual,
                revisado: true,
                fechaRevision: serverTimestamp()
            },
            {
                merge: true
            }
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
    if (!productosCategoria.length) {
        listaPendientesRevision.textContent =
            "No hay productos en esta categoría.";

        return;
    }

    const pendientes = [];

    for (const producto of productosCategoria) {
        const revisionId = `${mesActual}_${producto.id}`;

        const revisionSnapshot = await getDoc(
            doc(db, "revisionesStock", revisionId)
        );

        if (
            !revisionSnapshot.exists() ||
            revisionSnapshot.data().revisado !== true
        ) {
            pendientes.push(producto);
        }
    }

    contadorRevision.textContent =
        `${pendientes.length} producto(s) pendiente(s) de ${productosCategoria.length}`;

    if (!pendientes.length) {
        listaPendientesRevision.innerHTML = `
            <div class="alerta-exito">
                Todos los productos de esta categoría están revisados.
            </div>
        `;

        return;
    }

    listaPendientesRevision.innerHTML = pendientes
        .map(
            (producto) => `
                <div class="item-pendiente">
                    <strong>${producto.nombre || "Sin nombre"}</strong>
                    <span>
                        Código: ${producto.codigo || "-"}
                        | Stock: ${producto.stock ?? 0}
                    </span>
                </div>
            `
        )
        .join("");
}

cargarProductos();