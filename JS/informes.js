import {
    db,
    collection,
    getDocs
} from "./firebase.js";

let productos = [];

// ==========================
// CARGAR DATOS
// ==========================

async function cargarDatos() {

    const datos = await getDocs(
        collection(db, "productos")
    );

    productos = [];

    let total = 0;
    let valor = 0;
    let bajo = 0;
    let sin = 0;

    const categorias = {};

    datos.forEach((documento) => {

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

        if (
            p.categoria !== "Planchas de EVA" &&
            stock > 0 &&
            stock <= minimo
        ) {

            bajo++;

        }

        if (stock === 0) {

            sin++;

        }

        const categoria =
        p.categoria || "Sin categoría";

        if (!categorias[categoria]) {

            categorias[categoria] = {

                cantidad: 0,

                valor: 0

            };

        }

        categorias[categoria].cantidad++;

        categorias[categoria].valor +=
        stock * precio;

    });

    document.getElementById(
        "totalProductos"
    ).textContent = total;

    document.getElementById(
        "valorAlmacen"
    ).textContent =
    valor.toLocaleString(
        "es-ES",
        {
            style: "currency",
            currency: "EUR"
        }
    );

    document.getElementById(
        "stockBajo"
    ).textContent = bajo;

    document.getElementById(
        "sinStock"
    ).textContent = sin;

    crearGraficoCategorias(
        categorias
    );

    crearGraficoValor(
        categorias
    );

    mostrarInformes(
        categorias
    );

}

// ==========================
// GRÁFICO PRODUCTOS
// ==========================

function crearGraficoCategorias(categorias) {

    const canvas =
    document.getElementById(
        "graficoInformes"
    );

    if (!canvas) return;

    const grafico =
    Chart.getChart(canvas);

    if (grafico) {

        grafico.destroy();

    }

    new Chart(canvas, {

        type: "doughnut",

        data: {

            labels:
            Object.keys(categorias),

            datasets: [{

                data:
                Object.values(categorias)
                .map(c => c.cantidad),

                backgroundColor: [

                    "#2563eb",
                    "#16a34a",
                    "#f59e0b",
                    "#dc2626",
                    "#7c3aed",
                    "#0891b2",
                    "#ea580c",
                    "#0f766e"

                ],

                borderWidth: 0

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    position: "bottom"

                }

            }

        }

    });

}
// ==========================
// GRÁFICO VALOR CATEGORÍAS
// ==========================

function crearGraficoValor(categorias) {

    const canvas =
    document.getElementById(
        "graficoValorCategorias"
    );

    if (!canvas) return;

    const grafico =
    Chart.getChart(canvas);

    if (grafico) {

        grafico.destroy();

    }

    new Chart(canvas, {

        type: "bar",

        data: {

            labels:
            Object.keys(categorias),

            datasets: [{

                label: "Valor (€)",

                data:
                Object.values(categorias)
                .map(c => c.valor),

                backgroundColor:
                "#2563eb",

                borderRadius: 8

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    display: false

                }

            },

            scales: {

                y: {

                    beginAtZero: true

                }

            }

        }

    });

}

// ==========================
// INFORMES
// ==========================

function mostrarInformes(categorias){

    mostrarCategorias(categorias);

    mostrarStockBajo();

    mostrarSinStock();

    mostrarTopValor();

}

// ==========================
// VALOR POR CATEGORÍAS
// ==========================

function mostrarCategorias(categorias){

    const contenedor =
    document.getElementById(
        "informeCategorias"
    );

    if(!contenedor) return;

    let html="";

    Object.entries(categorias).forEach(([nombre,datos])=>{

        html+=`

        <div class="fila-informe">

            <span>${nombre}</span>

            <strong>

                ${datos.valor.toLocaleString(
                    "es-ES",
                    {
                        style:"currency",
                        currency:"EUR"
                    }
                )}

            </strong>

        </div>

        `;

    });

    contenedor.innerHTML=html;

}

// ==========================
// STOCK BAJO
// ==========================

function mostrarStockBajo(){

    const contenedor =
    document.getElementById(
        "informeStockBajo"
    );

    if(!contenedor) return;

    let html="";

    productos.forEach((p)=>{

        const stock=
        Number(p.stock)||0;

        const minimo=
        Number(p.stockMinimo??5);

        if(

            p.categoria!=="Planchas de EVA" &&

            stock>0 &&

            stock<=minimo

        ){

            html+=`

            <div class="fila-informe">

                <span>${p.nombre}</span>

                <strong style="color:#f59e0b">

                    ${stock}

                </strong>

            </div>

            `;

        }

    });

    if(html===""){

        html="<p>✅ No hay productos con stock bajo.</p>";

    }

    contenedor.innerHTML=html;

}
// ==========================
// SIN STOCK
// ==========================

function mostrarSinStock(){

    const contenedor =
    document.getElementById(
        "informeSinStock"
    );

    if(!contenedor) return;

    let html="";

    productos.forEach((p)=>{

        if((Number(p.stock)||0)===0){

            html+=`

            <div class="fila-informe">

                <span>${p.nombre}</span>

                <strong style="color:#dc2626">

                    Agotado

                </strong>

            </div>

            `;

        }

    });

    if(html===""){

        html="<p>✅ No hay productos agotados.</p>";

    }

    contenedor.innerHTML=html;

}

// ==========================
// TOP 10 VALOR
// ==========================

function mostrarTopValor(){

    const contenedor =
    document.getElementById(
        "informeValor"
    );

    if(!contenedor) return;

    let html="";

    [...productos]

    .sort((a,b)=>{

        return (

            (Number(b.stock)||0) *
            (Number(b.precio)||0)

        )-

        (

            (Number(a.stock)||0) *
            (Number(a.precio)||0)

        );

    })

    .slice(0,10)

    .forEach((p)=>{

        const valor =

        (Number(p.stock)||0) *
        (Number(p.precio)||0);

        html+=`

        <div class="fila-informe">

            <span>${p.nombre}</span>

            <strong>

                ${valor.toLocaleString(
                    "es-ES",
                    {
                        style:"currency",
                        currency:"EUR"
                    }
                )}

            </strong>

        </div>

        `;

    });

    if(html===""){

        html="<p>No hay productos.</p>";

    }

    contenedor.innerHTML=html;

}

// ==========================
// EXPORTAR EXCEL
// ==========================

function exportarExcel(){

    if(productos.length===0){

        alert("No hay productos para exportar.");

        return;

    }

    const datosExcel=[];

    let valorTotal=0;

    productos.forEach((p)=>{

        const valor=

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

// ==========================
// EVENTOS
// ==========================

const botonExportar =
document.getElementById(
    "exportarCSV"
);

if(botonExportar){

    botonExportar.addEventListener(

        "click",

        exportarExcel

    );

}

// ==========================
// INICIO
// ==========================

cargarDatos();