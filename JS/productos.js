console.log("PRODUCTOS.JS CARGADO");

import {
    db,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc
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

    querySnapshot.forEach((doc) => {

        const p = doc.data();

const texto = document
    .getElementById("buscar")
    .value
    .toLowerCase();

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

    <button onclick="editarProducto('${doc.id}')">
        ✏️ Editar
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

window.editarProducto = editarProducto;
window.guardarProducto = guardarProducto;

mostrarProductos();

document
    .getElementById("buscar")
    .addEventListener("input", mostrarProductos);