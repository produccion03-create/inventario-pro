import {
    db,
    collection,
    getDocs
} from "./firebase.js";


let productos = [];




// ==========================
// CARGAR DATOS
// ==========================

async function cargarDatos(){


    const datos =
    await getDocs(
        collection(db,"productos")
    );



    let total = 0;

    let valor = 0;

    let bajo = 0;

    let sin = 0;



    productos = [];



    datos.forEach((documento)=>{


        const p =
        documento.data();



        productos.push(p);



        total++;



        valor +=
        Number(p.stock || 0) *
        Number(p.precio || 0);




        if(Number(p.stock) < 5){

            bajo++;

        }




        if(Number(p.stock) === 0){

            sin++;

        }



    });





    document.getElementById("totalProductos").textContent =
    total;



    document.getElementById("valorAlmacen").textContent =
    valor.toLocaleString("es-ES",
    {
        style:"currency",
        currency:"EUR"
    });



    document.getElementById("stockBajo").textContent =
    bajo;



    document.getElementById("sinStock").textContent =
    sin;



}








// ==========================
// EXPORTAR EXCEL
// ==========================


function exportarExcel(){



    if(productos.length === 0){


        alert("No hay productos para exportar");

        return;

    }




    let datosExcel = [];



    let valorTotal = 0;



    productos.forEach((p)=>{



        const valor =

        Number(p.stock || 0) *
        Number(p.precio || 0);



        valorTotal += valor;



        datosExcel.push({



            Código:
            p.codigo || "",



            Producto:
            p.nombre || "",



            Categoría:
            p.categoria || "",



            Stock:
            Number(p.stock || 0),



            Precio:
            Number(p.precio || 0),



            "Valor total":
            valor



        });



    });





    datosExcel.push({});



    datosExcel.push({


        Producto:
        "TOTAL INVENTARIO",


        "Valor total":
        valorTotal


    });






    const hoja =

    XLSX.utils.json_to_sheet(
        datosExcel
    );





    const libro =

    XLSX.utils.book_new();





    XLSX.utils.book_append_sheet(

        libro,

        hoja,

        "Inventario"

    );






    XLSX.writeFile(

        libro,

        "Inventario_Pro.xlsx"

    );



}







document

.getElementById("exportarCSV")

.textContent =
"📗 Exportar Excel";



document

.getElementById("exportarCSV")

.addEventListener(

"click",

exportarExcel

);





cargarDatos();