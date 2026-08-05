import {
    db,
    collection,
    getDocs
} from "./firebase.js";

async function cargarDashboard() {

    const productos = await getDocs(
        collection(db, "productos")
    );

    let totalProductos = 0;
    let valorAlmacen = 0;
    let stockBajo = 0;
    let sinStock = 0;

    const categorias = {};

    productos.forEach((documento) => {

        const p = documento.data();

        const stock = Number(p.stock) || 0;
        const precio = Number(p.precio) || 0;
        const minimo = Number(p.stockMinimo ?? 5);

        totalProductos++;

        valorAlmacen += stock * precio;

        // Las Planchas de EVA no generan avisos
        if (
            p.categoria !== "Planchas de EVA" &&
            stock > 0 &&
            stock <= minimo
        ) {

            stockBajo++;

        }

        if (stock === 0) {

            sinStock++;

        }

        const categoria =
            p.categoria || "Sin categoría";

        if (!categorias[categoria]) {

            categorias[categoria] = {

                productos: 0,
                cantidad: 0,
                valor: 0

            };

        }

        categorias[categoria].productos++;

        categorias[categoria].cantidad += stock;

        categorias[categoria].valor += stock * precio;

    });

    // ==========================
    // TARJETAS
    // ==========================

    document.getElementById("totalProductos").textContent =
        totalProductos;

    document.getElementById("valorAlmacen").textContent =
        valorAlmacen.toLocaleString(
            "es-ES",
            {
                style: "currency",
                currency: "EUR"
            }
        );

    document.getElementById("stockBajo").textContent =
        stockBajo;

    document.getElementById("sinStock").textContent =
        sinStock;

    // ==========================
    // AVISOS
    // ==========================

    document.getElementById("contadorPendientes").textContent =
        stockBajo;

    // ==========================
    // RESTO
    // ==========================

    mostrarCategorias(categorias);

    crearGrafico(
        totalProductos,
        stockBajo,
        sinStock
    );

}

// ==========================
// LISTADO CATEGORÍAS
// ==========================

function mostrarCategorias(categorias) {

    let lista = "";

    Object.keys(categorias)
        .sort()
        .forEach((cat) => {

            lista += `

            <div class="movimiento">

                <h3>📂 ${cat}</h3>

                <p>
                    📦 Productos:
                    <strong>
                        ${categorias[cat].productos}
                    </strong>
                </p>

                <p>
                    📦 Stock total:
                    <strong>
                        ${categorias[cat].cantidad}
                    </strong>
                </p>

                <p>
                    💰 Valor:
                    <strong>
                        ${categorias[cat].valor.toLocaleString("es-ES", {
                            style: "currency",
                            currency: "EUR"
                        })}
                    </strong>
                </p>

            </div>

            `;

        });

    document.getElementById("listaCategorias").innerHTML =
        lista || "No hay categorías.";

}

// ==========================
// GRÁFICO
// ==========================

function crearGrafico(productos, bajo, sinStock) {

    const ctx =
        document.getElementById("graficoInventario");

    new Chart(ctx, {

        type: "doughnut",

        data: {

            labels: [

                "Productos",

                "Stock bajo",

                "Sin stock"

            ],

            datasets: [

                {

                    data: [

                        productos,

                        bajo,

                        sinStock

                    ],

                    backgroundColor: [

                        "#2563eb",

                        "#f59e0b",

                        "#dc2626"

                    ],

                    borderWidth: 2

                }

            ]

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
// INICIO
// ==========================

cargarDashboard();