import {
    db,
    collection,
    getDocs
} from "./firebase.js";

let productos = [];

// ==========================
// CARGAR INFORMES
// ==========================

async function cargarDatos(){

    const datos =
    await getDocs(
        collection(db,"productos")
    );

    productos = [];

    let total = 0;
    let valor = 0;
    let bajo = 0;
    let sin = 0;

    let categorias = {};

    datos.forEach((documento)=>{

        const p = documento.data();

        productos.push(p);

        const stock =
        Number(p.stock) || 0;

        const precio =
        Number(p.precio) || 0;

        const minimo =
        Number(p.stockMinimo ?? 5);

        total++;

        valor += stock * precio;

        // No controlar EVA

        if(
            p.categoria !== "Planchas de EVA" &&
            stock <= minimo &&
            stock > 0
        ){

            bajo++;

        }

        if(stock===0){

            sin++;

        }

        const cat =
        p.categoria || "Sin categoría";

        if(!categorias[cat]){

            categorias[cat]=0;

        }

        categorias[cat]++;

    });

    document.getElementById("totalProductos").textContent =
    total;

    document.getElementById("valorAlmacen").textContent =
    valor.toLocaleString(
        "es-ES",
        {
            style:"currency",
            currency:"EUR"
        }
    );

    document.getElementById("stockBajo").textContent =
    bajo;

    document.getElementById("sinStock").textContent =
    sin;

    crearGrafico(
        categorias
    );

}
// ==========================
// GRÁFICO
// ==========================

function crearGrafico(categorias){

    const ctx =
    document.getElementById("graficoInformes");

    new Chart(ctx,{

        type:"bar",

        data:{

            labels:Object.keys(categorias),

            datasets:[{

                label:"Productos por categoría",

                data:Object.values(categorias),

                borderRadius:8,

                backgroundColor:[
                    "#2563eb",
                    "#16a34a",
                    "#f59e0b",
                    "#dc2626",
                    "#7c3aed",
                    "#0891b2",
                    "#ea580c"
                ]

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{
                    display:false
                }

            },

            scales:{

                y:{
                    beginAtZero:true
                }

            }

        }

    });

}

// ==========================
// EXPORTAR EXCEL
// ==========================

function exportarExcel(){

    if(productos.length===0){

        alert("No hay productos para exportar");
        return;

    }

    let datosExcel=[];

    let valorTotal=0;

    productos.forEach((p)=>{

        const valor =
        (Number(p.stock)||0)*
        (Number(p.precio)||0);

        valorTotal+=valor;

        datosExcel.push({

            Código:p.codigo||"",

            Producto:p.nombre||"",

            Categoría:p.categoria||"",

            Stock:Number(p.stock)||0,

            Precio:Number(p.precio)||0,

            "Stock mínimo":Number(p.stockMinimo)||5,

            Valor:valor

        });

    });

    datosExcel.push({});

    datosExcel.push({

        Producto:"TOTAL INVENTARIO",

        Valor:valorTotal

    });

    const hoja=
    XLSX.utils.json_to_sheet(datosExcel);

    const libro=
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

// ==========================
// EVENTOS
// ==========================

document
.getElementById("exportarCSV")
.addEventListener(
    "click",
    exportarExcel
);

// ==========================
// INICIO
// ==========================

cargarDatos();