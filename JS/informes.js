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

        const stock = Number(p.stock) || 0;
        const precio = Number(p.precio) || 0;
        const minimo = Number(p.stockMinimo ?? 5);

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

    crearGraficoCategorias(categorias);

    crearGraficoValor(categorias);

    mostrarInformes(categorias);

}

// ==========================
// GRÁFICO PRODUCTOS
// ==========================

function crearGraficoCategorias(categorias) {

    const ctx =
        document.getElementById(
            "graficoInformes"
        );

    new Chart(ctx, {

        type: "doughnut",

        data: {

            labels: Object.keys(categorias),

            datasets: [{

                data: Object.values(categorias).map(
                    c => c.cantidad
                ),

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

    const ctx =
        document.getElementById(
            "graficoValorCategorias"
        );

    new Chart(ctx, {

        type: "bar",

        data: {

            labels: Object.keys(categorias),

            datasets: [{

                label: "Valor (€)",

                data: Object.values(categorias).map(
                    c => c.valor
                ),

                backgroundColor: "#2563eb",

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

    document.getElementById(
        "informeCategorias"
    ).innerHTML=html;

}

// ==========================
// STOCK BAJO
// ==========================

function mostrarStockBajo(){

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

    document.getElementById(
        "informeStockBajo"
    ).innerHTML=html;

}

// ==========================
// SIN STOCK
// ==========================

function mostrarSinStock(){

    let html="";

    productos.forEach((p)=>{

        if(Number(p.stock)===0){

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

    document.getElementById(
        "informeSinStock"
    ).innerHTML=html;

}

// ==========================
// TOP 10 VALOR
// ==========================

function mostrarTopValor(){

    let html="";

    [...productos]

    .sort((a,b)=>{

        const valorA=
        (Number(a.stock)||0)*
        (Number(a.precio)||0);

        const valorB=
        (Number(b.stock)||0)*
        (Number(b.precio)||0);

        return valorB-valorA;

    })

    .slice(0,10)

    .forEach((p)=>{

        const valor=

        (Number(p.stock)||0)*
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

    document.getElementById(
        "informeValor"
    ).innerHTML=html;

}

// ==========================
// EXPORTAR EXCEL
// ==========================

function exportarExcel(){

    if(productos.length===0){

        alert("No hay productos para exportar.");

        return;

    }

    const datos=[];

    let valorTotal=0;

    productos.forEach((p)=>{

        const valor=

        (Number(p.stock)||0)*
        (Number(p.precio)||0);

        valorTotal+=valor;

        datos.push({

            Código:p.codigo||"",

            Producto:p.nombre||"",

            Categoría:p.categoria||"",

            Stock:Number(p.stock)||0,

            Precio:Number(p.precio)||0,

            "Stock mínimo":Number(p.stockMinimo)||5,

            Valor:valor

        });

    });

    datos.push({});

    datos.push({

        Producto:"TOTAL INVENTARIO",

        Valor:valorTotal

    });

    const hoja=

    XLSX.utils.json_to_sheet(datos);

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