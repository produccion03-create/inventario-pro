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
document.getElementById("guardarSalida");



let productos = [];

let productoSeleccionado = null;




async function cargarProductos(){


    const datos =
    await getDocs(
        collection(db,"productos")
    );



    datos.forEach((documento)=>{


        productos.push({

            id:documento.id,

            ...documento.data()

        });


    });



    productos.forEach((p)=>{


        const opcion =
        document.createElement("option");


        opcion.value =
        p.id;


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


    const cantidadRestar =
    Number(cantidad.value);



    if(!productoSeleccionado){

        alert("Selecciona un producto");

        return;

    }



    if(cantidadRestar <= 0){

        alert("Cantidad incorrecta");

        return;

    }



    const nuevoStock =
    Number(productoSeleccionado.stock)
    -
    cantidadRestar;



    if(nuevoStock < 0){

        alert(
        "❌ No hay suficiente stock"
        );

        return;

    }



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




    await addDoc(

        collection(db,"movimientos"),

        {

            tipo:"Salida",

            producto:
            productoSeleccionado.nombre,


            cantidad:cantidadRestar,


            fecha:serverTimestamp()

        }

    );




    alert("✅ Salida registrada");


    location.reload();


});




cargarProductos();