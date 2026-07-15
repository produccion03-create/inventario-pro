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

async function guardarProducto() {

    let codigo = document.getElementById("codigo").value.trim();
    let nombre = document.getElementById("nombre").value.trim();
    let stock = document.getElementById("stock").value.trim();
    let ubicacion = document.getElementById("ubicacion").value.trim();
    let precio = document.getElementById("precio").value.trim();

    if (codigo === "" || nombre === "") {
        alert("Introduce el código y el nombre.");
        return;
    }

    try {

        await addDoc(collection(db, "productos"), {
            codigo,
            nombre,
            stock: Number(stock),
            ubicacion,
            precio: Number(precio)
        });

        alert("✅ Producto guardado en Firebase");

        document.getElementById("codigo").value = "";
        document.getElementById("nombre").value = "";
        document.getElementById("stock").value = "";
        document.getElementById("ubicacion").value = "";
        document.getElementById("precio").value = "";

        mostrarProductos();

    } catch (error) {

        console.error(error);
        alert("Error al guardar el producto");

    }

}

async function mostrarProductos() {

    let lista = document.getElementById("lista");

    lista.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "productos"));

    const texto = document
        .getElementById("buscar")
        .value
        .toLowerCase();

    querySnapshot.forEach((documento) => {

        const p = documento.data();

        if (
            !p.nombre.toLowerCase().includes(texto) &&
            !p.codigo.toLowerCase().includes(texto)
        ) {
            return;
        }

        lista.innerHTML += `
        <div class="movimiento">

            <h3>📦 ${p.nombre}</h3>

            <p><b>Código:</b> ${p.codigo}</p>

            <p><b>Stock:</b> ${p.stock}</p>

            <p><b>Ubicación:</b> ${p.ubicacion}</p>

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

async function editarProducto(id) {

    const nombre = prompt("Nuevo nombre:");
    if (nombre === null) return;

    const stock = prompt("Nuevo stock:");
    if (stock === null) return;

    const ubicacion = prompt("Nueva ubicación:");
    if (ubicacion === null) return;

    const precio = prompt("Nuevo precio:");
    if (precio === null) return;

    try {

        await updateDoc(doc(db, "productos", id), {

            nombre: nombre,
            stock: Number(stock),
            ubicacion: ubicacion,
            precio: Number(precio)

        });

        alert("✅ Producto actualizado");

        mostrarProductos();

    } catch (error) {

        console.error(error);
        alert("Error al actualizar");

    }

}

async function eliminarProducto(id) {

    const confirmar = confirm("¿Seguro que quieres eliminar este producto?");

    if (!confirmar) return;

    try {

        await deleteDoc(doc(db, "productos", id));

        alert("🗑️ Producto eliminado");

        mostrarProductos();

    } catch (error) {

        console.error(error);
        alert("Error al eliminar el producto");

    }

}

window.guardarProducto = guardarProducto;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;

mostrarProductos();

document
    .getElementById("buscar")
    .addEventListener("input", mostrarProductos);