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


const cantidad =
document.getElementById("cantidad");


const boton =
document.getElementById("guardarEntrada");



let productos = [];

let productoSeleccionado = null;



async function cargarProductos(){


    const datos = await getDocs(
        collection(db,"productos")
    );


    datos.forEach((documento)=>{


        const p = documento.data();


        productos.push({

            id:documento.id,

            ...p

        });


    });



    productos.forEach((p)=>{


        const opcion =
        document.createElement("option");


        opcion.value = p.id;


        opcion.textContent =
        p.nombre +
        " (Stock: " +
        p.stock +
        ")";


        selectorProducto.appendChild(opcion);


    });



    actualizarStock();



}




function actualizarStock(){


    productoSeleccionado =
    productos.find(
        p => p.id === selectorProducto.value
    );


    if(productoSeleccionado){


        stockActual.textContent =
        productoSeleccionado.stock;


    }


}




selectorProducto.addEventListener(
"change",
actualizarStock
);





boton.addEventListener(
"click",
async()=>{


    const cantidadAñadir =
    Number(cantidad.value);



    if(!productoSeleccionado){

        alert("Selecciona un producto");

        return;

    }



    if(cantidadAñadir <= 0){

        alert("Cantidad incorrecta");

        return;

    }



    const nuevoStock =
    Number(productoSeleccionado.stock)
    +
    cantidadAñadir;



    // Actualizar producto


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




    // Guardar movimiento


    await addDoc(

        collection(db,"movimientos"),

        {

            tipo:"Entrada",

            producto:
            productoSeleccionado.nombre,


            cantidad:cantidadAñadir,


            fecha:serverTimestamp()

        }

    );




    alert("✅ Entrada registrada");



    location.reload();



});




cargarProductos();