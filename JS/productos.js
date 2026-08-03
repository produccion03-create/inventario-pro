console.log("PRODUCTOS.JS CARGADO");

import {
    db,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "./firebase.js";


// ==========================
// GUARDAR PRODUCTO
// ==========================

async function guardarProducto() {

    const codigo = document.getElementById("codigo").value.trim();
    const nombre = document.getElementById("nombre").value.trim();
    const categoria = document.getElementById("categoria").value;
    const stock = Number(document.getElementById("stock").value);
    const precio = Number(document.getElementById("precio").value);
    const stockMinimo = Number(document.getElementById("stockMinimo").value);

    if (codigo === "" || nombre === "") {
        alert("Introduce el código y el nombre.");
        return;
    }

    if (categoria === "") {
        alert("Selecciona una categoría.");
        return;
    }

    try {

        await addDoc(collection(db, "productos"), {

            codigo,
            nombre,
            categoria,
            stock,
            precio,
            stockMinimo

        });

        alert("✅ Producto guardado");

        document.getElementById("codigo").value = "";
        document.getElementById("nombre").value = "";
        document.getElementById("categoria").value = "";
        document.getElementById("stock").value = "";
        document.getElementById("precio").value = "";
        document.getElementById("stockMinimo").value = 5;

        mostrarProductos();

    } catch (error) {

        console.error(error);
        alert("Error al guardar");

    }

}



// ==========================
// MOSTRAR PRODUCTOS
// ==========================

async function mostrarProductos() {

    const lista = document.getElementById("lista");

    lista.innerHTML = "";

    const datos = await getDocs(collection(db, "productos"));

    const texto = document
        .getElementById("buscar")
        .value
        .toLowerCase();

    datos.forEach((documento) => {

        const p = documento.data();

        const nombre = (p.nombre || "").toLowerCase();
        const codigo = (p.codigo || "").toLowerCase();
        const categoria = (p.categoria || "").toLowerCase();

        if (
            !nombre.includes(texto) &&
            !codigo.includes(texto) &&
            !categoria.includes(texto)
        ) {
            return;
        }

        let colorStock = "#16a34a";

        if (p.stock <= p.stockMinimo) {
            colorStock = "#dc2626";
        }

        lista.innerHTML += `

        <div class="movimiento">

            <h3>📦 ${p.nombre}</h3>

            <p><b>Código:</b> ${p.codigo}</p>

            <p><b>Categoría:</b> ${p.categoria}</p>

            <p style="color:${colorStock};">

                <b>Stock:</b> ${p.stock}

            </p>

            <p><b>Stock mínimo:</b> ${p.stockMinimo}</p>

            <p><b>Precio:</b> ${p.precio} €</p>

            <button onclick="editarProducto('${documento.id}')">

                ✏️ Editar

            </button>

            <button onclick="eliminarProducto('${documento.id}')">

                🗑️ Eliminar

            </button>

        </div>

        `;

    });

}



// ==========================
// EDITAR
// ==========================

async function editarProducto(id) {

    const datos = await getDocs(collection(db, "productos"));

    datos.forEach((documento) => {

        if (documento.id === id) {

            const p = documento.data();

            document.getElementById("editarId").value = id;
            document.getElementById("editarCodigo").value = p.codigo;
            document.getElementById("editarNombre").value = p.nombre;
            document.getElementById("editarCategoria").value = p.categoria || "";
            document.getElementById("editarStock").value = p.stock;
            document.getElementById("editarPrecio").value = p.precio;
            document.getElementById("editarStockMinimo").value = p.stockMinimo ?? 5;

            document.getElementById("modalEditar").style.display = "flex";

        }

    });

}



// ==========================
// GUARDAR EDICIÓN
// ==========================

async function guardarEdicion() {

    const id = document.getElementById("editarId").value;

    try {

        await updateDoc(doc(db, "productos", id), {

            codigo: document.getElementById("editarCodigo").value,
            nombre: document.getElementById("editarNombre").value,
            categoria: document.getElementById("editarCategoria").value,
            stock: Number(document.getElementById("editarStock").value),
            precio: Number(document.getElementById("editarPrecio").value),
            stockMinimo: Number(document.getElementById("editarStockMinimo").value)

        });

        alert("✅ Producto actualizado");

        cerrarModal();

        mostrarProductos();

    } catch (error) {

        console.error(error);

        alert("Error al actualizar");

    }

}



// ==========================
// CERRAR MODAL
// ==========================

function cerrarModal() {

    document.getElementById("modalEditar").style.display = "none";

}



// ==========================
// ELIMINAR
// ==========================

async function eliminarProducto(id) {

    if (!confirm("¿Eliminar este producto?")) return;

    try {

        await deleteDoc(doc(db, "productos", id));

        alert("🗑️ Producto eliminado");

        mostrarProductos();

    } catch (error) {

        console.error(error);

        alert("Error al eliminar");

    }

}



// ==========================

window.guardarProducto = guardarProducto;
window.editarProducto = editarProducto;
window.guardarEdicion = guardarEdicion;
window.cerrarModal = cerrarModal;
window.eliminarProducto = eliminarProducto;

mostrarProductos();

document
    .getElementById("buscar")
    .addEventListener("input", mostrarProductos);