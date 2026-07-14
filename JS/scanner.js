let productos = JSON.parse(localStorage.getItem("productos")) || [];


function encontrado(codigo){

    console.log("Código leído:", codigo);


    let producto = productos.find(function(p){

        return p.codigo == codigo;

    });


    let resultado = document.getElementById("resultado");


    if(producto){

        resultado.innerHTML = 
        `
        📦 ${producto.nombre}<br>
        Código: ${producto.codigo}<br>
        Stock: ${producto.stock}<br>
        Ubicación: ${producto.ubicacion}
        `;

    } else {

        resultado.innerHTML =
        `
        ❌ No encontrado<br>
        Código leído: ${codigo}
        `;

    }

}


let scanner = new Html5QrcodeScanner(
    "lector",
    {
        fps: 10,
        qrbox: 300
    }
);


scanner.render(encontrado);