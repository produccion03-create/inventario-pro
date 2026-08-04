import {

    db,
    collection,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp

} from "./firebase.js";

const selectorProducto =
document.getElementById("producto");

const stockActual =
document.getElementById("stockActual");

const stockActual2 =
document.getElementById("stockActual2");

const cantidad =
document.getElementById("cantidad");

const cantidadVista =
document.getElementById("cantidadVista");

const observaciones =
document.getElementById("observaciones");

const boton =
document.getElementById("guardarEntrada");

let productos = [];

let productoSeleccionado = null;

// ==========================
// CARGAR PRODUCTOS
// ==========================

async function cargarProductos(){

    const datos = await getDocs(
        collection(db,"productos")
    );

    productos = [];

    selectorProducto.innerHTML = "";

    datos.forEach((documento)=>{

        const p = documento.data();

        productos.push({

            id: documento.id,

            ...p

        });

    });

    productos.sort((a,b)=>
        a.nombre.localeCompare(b.nombre)
    );

    productos.forEach((p)=>{

        const opcion =
        document.createElement("option");

        opcion.value = p.id;

        opcion.textContent =
        p.nombre +
        " · Stock " +
        p.stock;

        selectorProducto.appendChild(opcion);

    });

    actualizarStock();

}

// ==========================
// ACTUALIZAR STOCK
// ==========================

function actualizarStock(){

    productoSeleccionado =
    productos.find(
        p => p.id === selectorProducto.value
    );

    if(!productoSeleccionado) return;

    stockActual.textContent =
    productoSeleccionado.stock;

    stockActual2.textContent =
    productoSeleccionado.stock;

}

selectorProducto.addEventListener(
"change",
actualizarStock
);

cantidad.addEventListener(
"input",
()=>{

    cantidadVista.textContent =
    cantidad.value || 0;

});

// ==========================
// GUARDAR ENTRADA
// ==========================

boton.addEventListener(
"click",
async()=>{

    const cantidadAñadir =
    Number(cantidad.value);

    if(!productoSeleccionado){

        alert("Selecciona un producto");
        return;

    }

    if(cantidadAñadir<=0){

        alert("Introduce una cantidad válida");
        return;

    }

    const nuevoStock =
    Number(productoSeleccionado.stock)
    +
    cantidadAñadir;

    // ACTUALIZAR STOCK

    await updateDoc(

        doc(
            db,
            "productos",
            productoSeleccionado.id
        ),

        {

            stock:nuevoStock

        }

    );

    // GUARDAR MOVIMIENTO

    await addDoc(

        collection(db,"movimientos"),

        {

            tipo:"Entrada",

            codigo:productoSeleccionado.codigo,

            producto:productoSeleccionado.nombre,

            categoria:productoSeleccionado.categoria || "",

            cantidad:cantidadAñadir,

            stockAnterior:Number(productoSeleccionado.stock),

            stockFinal:nuevoStock,

            observaciones:
            observaciones.value.trim(),

            fecha:serverTimestamp()

        }

    );

    alert("✅ Entrada registrada correctamente");

    location.reload();

});

// ==========================
// INICIO
// ==========================

cargarProductos();