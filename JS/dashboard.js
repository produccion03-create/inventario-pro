import {
    db,
    collection,
    getDocs
} from "./firebase.js";


async function cargarDashboard() {


    const productos = await getDocs(collection(db, "productos"));


    let totalProductos = 0;
    let valorAlmacen = 0;
    let stockBajo = 0;
    let sinStock = 0;

    let listaStockBajo = "";



    productos.forEach((documento) => {


        const p = documento.data();


        totalProductos++;


        valorAlmacen += Number(p.stock) * Number(p.precio);



        // STOCK BAJO

        if (Number(p.stock) < 5) {


            stockBajo++;


            listaStockBajo += `

            <div class="alerta-stock">


                <h3>
                ⚠️ ${p.nombre}
                </h3>


                <p>
                📦 Stock actual:
                <strong>${p.stock}</strong>
                </p>


                <p>
                📍 Ubicación:
                ${p.ubicacion}
                </p>


                <span>
                🔄 Necesita reposición
                </span>


            </div>

            `;


        }



        // SIN STOCK

        if (Number(p.stock) === 0) {


            sinStock++;


        }


    });




    document.getElementById("totalProductos").textContent =
        totalProductos;



    document.getElementById("valorAlmacen").textContent =
        valorAlmacen.toFixed(2) + " €";



    document.getElementById("stockBajo").textContent =
        stockBajo;



    document.getElementById("sinStock").textContent =
        sinStock;




    const lista = document.getElementById("listaStockBajo");



    if (lista) {


        if (listaStockBajo === "") {


            lista.innerHTML =
            "✅ No hay productos con stock bajo";


        } else {


            lista.innerHTML =
            listaStockBajo;


        }


    }



}



cargarDashboard();