let productos = JSON.parse(localStorage.getItem("productos")) || [];

function guardarProducto() {

    let codigo = document.getElementById("codigo").value.trim();
    let nombre = document.getElementById("nombre").value.trim();
    let stock = document.getElementById("stock").value.trim();
    let ubicacion = document.getElementById("ubicacion").value.trim();
    let precio = document.getElementById("precio").value.trim();

    if (codigo == "" || nombre == "") {
        alert("Debes introducir al menos el código y el nombre.");
        return;
    }

    let producto = {
        codigo: codigo,
        nombre: nombre,
        stock: stock,
        ubicacion: ubicacion,
        precio: precio
    };

    productos.push(producto);

    localStorage.setItem("productos", JSON.stringify(productos));

    mostrarProductos();

    document.getElementById("codigo").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("ubicacion").value = "";
    document.getElementById("precio").value = "";

    alert("Producto guardado correctamente");
}

function mostrarProductos() {

    let lista = document.getElementById("lista");

    lista.innerHTML = "";

    productos.forEach(function (p) {

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

mostrarProductos();