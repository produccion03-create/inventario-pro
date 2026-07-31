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
            precio

        });

        alert("✅ Producto guardado");

        document.getElementById("codigo").value = "";
        document.getElementById("nombre").value = "";
        document.getElementById("categoria").value = "";
        document.getElementById("stock").value = "";
        document.getElementById("precio").value = "";

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

    const categorias = {};

    datos.forEach((documento) => {

        const p = documento.data();

        const nombre = (p.nombre || "").toLowerCase();
        const codigo = (p.codigo || "").toLowerCase();
        const categoria = (p.categoria || "Sin categoría");

        if (
            !nombre.includes(texto) &&
            !codigo.includes(texto) &&
            !categoria.toLowerCase().includes(texto)
        ) {
            return;
        }

        if (!categorias[categoria]) {
            categorias[categoria] = [];
        }

        categorias[categoria].push({
            id: documento.id,
            ...p
        });

    });

    Object.keys(categorias).sort().forEach((categoria) => {

        lista.innerHTML += `

        <div class="panel">

            <h2>📂 ${categoria}</h2>

        </div>

        `;

        categorias[categoria].forEach((p) => {

            let colorStock = "#16a34a";

            if (p.stock == 0) {
                colorStock = "#dc2626";
            } else if (p.stock < 5) {
                colorStock = "#f59e0b";
            }

            lista.innerHTML += `

            <div class="movimiento">

                <h3>📦 ${p.nombre}</h3>

                <p><b>Código:</b> ${p.codigo}</p>

                <p>
                    <b>Stock:</b>
                    <span style="color:${colorStock};font-weight:bold;">
                        ${p.stock}
                    </span>
                </p>

                <p><b>Precio:</b> ${p.precio} €</p>

                <button onclick="editarProducto('${p.id}')">

                    ✏️ Editar

                </button>

                <button onclick="eliminarProducto('${p.id}')">

                    🗑️ Eliminar

                </button>

            </div>

            `;

        });

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
            precio: Number(document.getElementById("editarPrecio").value)

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


window.guardarProducto = guardarProducto;
window.editarProducto = editarProducto;
window.guardarEdicion = guardarEdicion;
window.cerrarModal = cerrarModal;
window.eliminarProducto = eliminarProducto;

mostrarProductos();

document
    .getElementById("buscar")
    .addEventListener("input", mostrarProductos);