import {
    db,
    collection,
    getDocs
} from "./firebase.js";

let pendientes = [];

// ==========================
// CARGAR PENDIENTES
// ==========================

async function cargarPendientes() {

    const lista =
    document.getElementById(
        "listaPendientes"
    );

    lista.innerHTML =
    "Cargando...";

    pendientes = [];

    const datos =
    await getDocs(
        collection(db,"productos")
    );

    datos.forEach((documento)=>{

        const p =
        documento.data();

        // No controlar EVA

        if(
            p.categoria ===
            "Planchas de EVA"
        ) return;

        const stock =
        Number(p.stock)||0;

        const minimo =
        Number(p.stockMinimo??5);

        if(stock<=minimo){

            pendientes.push({

                id:documento.id,

                codigo:p.codigo||"",

                nombre:p.nombre||"",

                categoria:p.categoria||"",

                stock:stock,

                minimo:minimo,

                precio:Number(p.precio)||0,

                valor:
                stock*
                (Number(p.precio)||0)

            });

        }

    });

    mostrarPendientes();

}

// ==========================
// MOSTRAR
// ==========================

function mostrarPendientes(){

    const lista =
    document.getElementById(
        "listaPendientes"
    );

    const texto =
    document
    .getElementById("buscar")
    .value
    .toLowerCase()
    .trim();

    lista.innerHTML="";

    let contadorBajo=0;

    let contadorSinStock=0;

    pendientes

    .sort((a,b)=>a.stock-b.stock)

    .forEach((p)=>{

        if(

            !p.nombre
            .toLowerCase()
            .includes(texto)

            &&

            !p.codigo
            .toLowerCase()
            .includes(texto)

        ){

            return;

        }

        let estado="🟠 Stock bajo";

        let color="#f59e0b";

        if(p.stock===0){

            estado="🔴 Sin stock";

            color="#dc2626";

            contadorSinStock++;

        }else{

            contadorBajo++;

        }

        lista.innerHTML+=`

        <div class="movimiento"
        style="border-left:8px solid ${color}">

            <h3>${estado}</h3>

            <p>

                <strong>📦 Producto:</strong>

                ${p.nombre}

            </p>

            <p>

                <strong>🏷 Código:</strong>

                ${p.codigo}

            </p>

            <p>

                <strong>📂 Categoría:</strong>

                ${p.categoria}

            </p>

            <p>

                <strong>📦 Stock:</strong>

                ${p.stock}

            </p>

            <p>

                <strong>⚠ Stock mínimo:</strong>

                ${p.minimo}

            </p>

            <p>

                <strong>💰 Precio:</strong>

                ${p.precio.toFixed(2)} €

            </p>

            <p>

                <strong>💵 Valor:</strong>

                ${p.valor.toLocaleString(
                    "es-ES",
                    {
                        style:"currency",
                        currency:"EUR"
                    }
                )}

            </p>

        </div>

        `;

    });

    if(lista.innerHTML===""){

        lista.innerHTML=`

        <div class="panel">

            ✅ No hay productos pendientes.

        </div>

        `;

    }

    document.getElementById(
        "contadorBajo"
    ).textContent=contadorBajo;

    document.getElementById(
        "contadorSinStock"
    ).textContent=contadorSinStock;

}

// ==========================
// BUSCADOR
// ==========================

document

.getElementById("buscar")

.addEventListener(

    "input",

    mostrarPendientes

);

// ==========================
// INICIO
// ==========================

cargarPendientes();