let productos = JSON.parse(localStorage.getItem("productos")) || [];


function guardarProducto(){

    let producto = {

        codigo: document.getElementById("codigo").value,

        nombre: document.getElementById("nombre").value,

        stock: document.getElementById("stock").value,

        ubicacion: document.getElementById("ubicacion").value,

        precio: document.getElementById("precio").value

    };


    productos.push(producto);


    localStorage.setItem(
        "productos",
        JSON.stringify(productos)
    );


    mostrarProductos();


    alert("Producto guardado correctamente");

}



function mostrarProductos(){

    let lista = document.getElementById("lista");

    lista.innerHTML = "";


    productos.forEach(function(p){

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