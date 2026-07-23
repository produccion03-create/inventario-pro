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


    try{


        const datos =
        await getDocs(
            collection(db,"productos")
        );



        selectorProducto.innerHTML =
        "<option value=''>Selecciona producto</option>";



        datos.forEach((documento)=>{


            const p = documento.data();


            productos.push({

                id:documento.id,

                ...p

            });



            const opcion =
            document.createElement("option");


            opcion.value =
            documento.id;


            opcion.textContent =
            p.nombre +
            " - Stock: " +
            p.stock;


            selectorProducto.appendChild(opcion);


        });



    }catch(error){


        console.error(
            "Error cargando productos:",
            error
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


    }else{


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



    if(cantidadSalida <= 0){


        alert(
        "Cantidad incorrecta"
        );

        return;

    }



    const nuevoStock =
    Number(productoSeleccionado.stock)
    -
    cantidadSalida;



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

        tipo: "Salida",

        codigo: productoSeleccionado.codigo,

        producto: productoSeleccionado.nombre,

        cantidad: cantidadSalida,

        stockAnterior: Number(productoSeleccionado.stock),

        stockFinal: nuevoStock,

        ubicacion: productoSeleccionado.ubicacion,

        fecha: serverTimestamp()

    }

);



    alert(
    "✅ Salida registrada"
    );


    location.reload();



});





cargarProductos();