// Base de datos inicial del inventario

let productos = JSON.parse(localStorage.getItem("productos")) || [];


function guardarProductos(){

    localStorage.setItem(
        "productos",
        JSON.stringify(productos)
    );

}


// Añadir producto

function agregarProducto(producto){

    productos.push(producto);

    guardarProductos();

}


// Buscar producto por código

function buscarProducto(codigo){

    return productos.find(
        p => p.codigo == codigo
    );

}


// Mostrar productos en consola (prueba)

console.log(productos);