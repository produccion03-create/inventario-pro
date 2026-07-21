import {
    db,
    collection,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp
} from "./firebase.js";


const selectorProducto = document.getElementById("producto");
const stockActual = document.getElementById("stockActual");
const cantidad = document.getElementById("cantidad");
const boton = document.getElementById("guardarSalida");


let productos = [];
let productoSeleccionado = null;



async function cargarProductos() {


    try {


        const datos = await getDocs(
            collection(db, "productos")
        );


        productos = [];


        datos.forEach((documento)=>{


            productos.push({

                id: documento.id,

                ...documento.data()

            });


        });



        selectorProducto.innerHTML =
        "<option value=''>Selecciona producto</option>";



        productos.forEach((p)=>{


            const opcion =
            document.createElement("option");


            opcion.value = p.id;


            opcion.textContent =
            p.nombre +
            " - Stock: " +
            p.stock;


            selectorProducto.appendChild(opcion);


        });



    } catch(error) {


        console.error(
            "Error cargando productos:",
            error
        );


        alert(
            "Error cargando productos"
        );


    }


}




function actualizarStock(){


    productoSeleccionado =
    productos.find(
        p => p.id === selectorProducto.value
    );


    if(productoSeleccionado){


        stockActual.textContent =
        productoSeleccionado.stock;


    } else {


        stockActual.textContent = 0;


    }


}



selectorProducto.addEventListener(
"change",
actualizarStock
);





boton.addEventListener(
"click",
async()=>{


    if(!productoSeleccionado){

        alert(
        "Selecciona un producto"
        );

        return;

    }



    const cantidadSalida =
    Number(cantidad.value);



    const nuevoStock =
    Number(productoSeleccionado.stock)
    -
    cantidadSalida;



    if(cantidadSalida <= 0){

        alert(
        "Cantidad incorrecta"
        );

        return;

    }



    if(nuevoStock < 0){

        alert(
        "❌ Stock insuficiente"
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

            cantidad:cantidadSalida,

            fecha:serverTimestamp()

        }

    );



    alert(
    "✅ Salida registrada"
    );


    location.reload();


});




cargarProductos();