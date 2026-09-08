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
const panelPendientes = document.getElementById("panelPendientes");

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

const fechaActual = new Date();

const mesActual =
    `${fechaActual.getFullYear()}-${String(
        fechaActual.getMonth() + 1
    ).padStart(2, "0")}`;


async function cargarProductos() {

    try {

        const snapshot = await getDocs(
            collection(db, "productos")
        );

        productos = snapshot.docs.map((documento) => ({
            id: documento.id,
            ...documento.data()
        }));

        cargarCategorias();

    } catch (error) {

        console.error("Error cargando productos:", error);

        categoriaSelect.innerHTML = `
            <option value="">
                Error cargando categorías
            </option>
        `;

        contadorRevision.textContent =
            "No se pudieron cargar los productos.";

        contadorRevision.className = "alerta-error";

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
        <option value="">
            Selecciona una categoría
        </option>
    `;


    categorias.forEach((categoria) => {

        const opcion = document.createElement("option");

        opcion.value = categoria;
        opcion.textContent = categoria;

        categoriaSelect.appendChild(opcion);

    });

}


categoriaSelect.addEventListener("change", async () => {

    categoriaActual = categoriaSelect.value;


    if (!categoriaActual) {

        panelRevision.style.display = "none";
        panelPendientes.style.display = "none";

        contadorRevision.textContent =
            "Selecciona una categoría para comenzar.";

        contadorRevision.className = "alerta-info";

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
    panelPendientes.style.display = "block";


    await mostrarProducto();

});


async function mostrarProducto() {

    if (!productosCategoria.length) {

        panelRevision.style.display = "none";

        contadorRevision.textContent =
            "Esta categoría no tiene productos.";

        contadorRevision.className = "alerta-info";

        await mostrarPendientes();

        return;

    }


    const producto = productosCategoria[indiceActual];


    nombreProducto.textContent =
        producto.nombre || "Producto sin nombre";

    codigoProducto.textContent =
        producto.codigo || "-";

    stockSistema.textContent =
        producto.stock ?? 0;


    progresoRevision.textContent =
        `Producto ${indiceActual + 1} de ${productosCategoria.length}`;


    stockFisico.value = "";


    const revisionId =
        `${mesActual}_${producto.id}`;


    const revisionReferencia = doc(
        db,
        "revisionesStock",
        revisionId
    );


    try {

        const revisionSnapshot = await getDoc(
            revisionReferencia
        );


        if (
            revisionSnapshot.exists() &&
            revisionSnapshot.data().revisado === true
        ) {

            const revision = revisionSnapshot.data();

            stockFisico.value =
                revision.stockFisico ?? "";

            estadoProducto.textContent =
                "Este producto ya está revisado.";

            estadoProducto.className =
                "alerta-exito";

            marcarRevisado.textContent =
                "Guardar revisión";

        } else {

            estadoProducto.textContent =
                "Producto pendiente de revisar.";

            estadoProducto.className =
                "alerta-info";

            marcarRevisado.textContent =
                "Marcar como revisado";

        }

    } catch (error) {

        console.error("Error consultando revisión:", error);

        estadoProducto.textContent =
            "No se pudo consultar el estado del producto.";

        estadoProducto.className =
            "alerta-error";

    }


    anterior.disabled =
        indiceActual === 0;

    siguiente.disabled =
        indiceActual === productosCategoria.length - 1;


    await mostrarPendientes();

}


marcarRevisado.addEventListener("click", async () => {

    const producto = productosCategoria[indiceActual];

    if (!producto) {
        return;
    }


    if (
        stockFisico.value === "" ||
        Number(stockFisico.value) < 0
    ) {

        alert("Introduce el stock físico contado.");

        stockFisico.focus();

        return;

    }


    const cantidadFisica =
        Number(stockFisico.value);


    try {

        const revisionId =
            `${mesActual}_${producto.id}`;


        await setDoc(
            doc(
                db,
                "revisionesStock",
                revisionId
            ),
            {
                productoId: producto.id,

                nombreProducto:
                    producto.nombre || "",

                codigo:
                    producto.codigo || "",

                categoria:
                    producto.categoria || "",

                stockSistema:
                    Number(producto.stock || 0),

                stockFisico:
                    cantidadFisica,

                mes:
                    mesActual,

                revisado:
                    true,

                fechaRevision:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );


        estadoProducto.textContent =
            "Producto revisado correctamente.";

        estadoProducto.className =
            "alerta-exito";

        marcarRevisado.textContent =
            "Guardar revisión";


        await mostrarPendientes();


    } catch (error) {

        console.error("Error guardando revisión:", error);

        alert("No se pudo guardar la revisión.");

    }

});


anterior.addEventListener("click", async () => {

    if (indiceActual <= 0) {
        return;
    }

    indiceActual--;

    await mostrarProducto();

});


siguiente.addEventListener("click", async () => {

    if (
        indiceActual >= productosCategoria.length - 1
    ) {
        return;
    }

    indiceActual++;

    await mostrarProducto();

});


async function mostrarPendientes() {

    if (!productosCategoria.length) {

        listaPendientesRevision.textContent =
            "No hay productos en esta categoría.";

        contadorRevision.textContent =
            "0 productos en esta categoría.";

        return;

    }


    const pendientes = [];


    for (const producto of productosCategoria) {

        const revisionId =
            `${mesActual}_${producto.id}`;


        try {

            const revisionSnapshot = await getDoc(
                doc(
                    db,
                    "revisionesStock",
                    revisionId
                )
            );


            if (
                !revisionSnapshot.exists() ||
                revisionSnapshot.data().revisado !== true
            ) {

                pendientes.push(producto);

            }

        } catch (error) {

            console.error(
                "Error consultando producto pendiente:",
                error
            );

        }

    }


    contadorRevision.textContent =
        `${pendientes.length} producto(s) pendiente(s) de ${productosCategoria.length}`;

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
        pendientes
            .map(
                (producto) => `
                    <div class="item-pendiente">
                        <strong>
                            ${escaparHTML(
                                producto.nombre || "Sin nombre"
                            )}
                        </strong>

                        <span>
                            Código:
                            ${escaparHTML(
                                producto.codigo || "-"
                            )}

                            |
                            Stock:
                            ${producto.stock ?? 0}
                        </span>
                    </div>
                `
            )
            .join("");

}


function escaparHTML(valor) {

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


cargarProductos();