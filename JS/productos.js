console.log("PRODUCTOS.JS CARGADO");

import { db, collection, addDoc, getDocs } from "./firebase.js";

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
        <div>
            📦 <b>${p.nombre}</b><br>
            Código: ${p.codigo}<br>
            Stock: ${p.stock}<br>
            Ubicación: ${p.ubicacion}<br>
            Precio: ${p.precio} €
            <hr>
        </div>
        `;

    });

}

window.guardarProducto = guardarProducto;

mostrarProductos();

document
    .getElementById("buscar")
    .addEventListener("input", mostrarProductos);