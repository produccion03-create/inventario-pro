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
document.getElementById("guardarSalida");

let productos = [];

let productoSeleccionado = null;

// ==========================
// CARGAR PRODUCTOS
// ==========================

async function cargarProductos(){

    try{

        const datos =
        await getDocs(
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

    }catch(error){

        console.error(error);

    }

}

// ==========================
// ACTUALIZAR STOCK
// ==========================

function actualizarStock(){

    productoSeleccionado =
    productos.find(
        p => p.id === selectorProducto.value
    );

    if(!productoSeleccionado){

        stockActual.textContent = 0;
        stockActual2.textContent = 0;

        return;

    }

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
// GUARDAR SALIDA
// ==========================

boton.addEventListener(
"click",
async()=>{

    if(!productoSeleccionado){

        alert("Selecciona un producto");
        return;

    }

    const cantidadSalida =
    Number(cantidad.value);

    if(cantidadSalida<=0){

        alert("Introduce una cantidad válida");
        return;

    }

    const nuevoStock =
    Number(productoSeleccionado.stock)
    -
    cantidadSalida;

    if(nuevoStock<0){

        alert("❌ No hay suficiente stock");
        return;

    }

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

            tipo:"Salida",

            codigo:productoSeleccionado.codigo,

            producto:productoSeleccionado.nombre,

            categoria:productoSeleccionado.categoria || "",

            cantidad:cantidadSalida,

            stockAnterior:Number(productoSeleccionado.stock),

            stockFinal:nuevoStock,

            observaciones:
            observaciones.value.trim(),

            fecha:serverTimestamp()

        }

    );

    alert("✅ Salida registrada correctamente");

    location.reload();

});

// ==========================
// INICIO
// ==========================

cargarProductos();