console.log("PRODUCTOS.JS CARGADO");

import {
    db,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "./firebase.js";


// ==========================
// GUARDAR PRODUCTO
// ==========================

async function guardarProducto() {

    let codigo = document.getElementById("codigo").value.trim();
    let nombre = document.getElementById("nombre").value.trim();
    let stock = document.getElementById("stock").value.trim();
    let ubicacion = document.getElementById("ubicacion").value.trim();
    let precio = document.getElementById("precio").value.trim();


    if (codigo === "" || nombre === "") {

        alert("Introduce el código y el nombre.");

        return;

    }


    try {

        await addDoc(
            collection(db, "productos"),
            {

                codigo,

                nombre,

                stock: Number(stock),

                ubicacion,

                precio: Number(precio)

            }
        );


        alert("✅ Producto guardado");


        document.getElementById("codigo").value = "";
        document.getElementById("nombre").value = "";
        document.getElementById("stock").value = "";
        document.getElementById("ubicacion").value = "";
        document.getElementById("precio").value = "";


        mostrarProductos();


    } catch(error) {


        console.error(error);

        alert("Error al guardar producto");


    }

}



// ==========================
// MOSTRAR PRODUCTOS
// ==========================


async function mostrarProductos() {


    const lista =
    document.getElementById("lista");


    lista.innerHTML = "";


    const productos =
    await getDocs(
        collection(db,"productos")
    );



    const texto =
    document
    .getElementById("buscar")
    .value
    .toLowerCase();



    productos.forEach((documento)=>{


        const p =
        documento.data();



        const nombre =
        (p.nombre || "")
        .toLowerCase();


        const codigo =
        (p.codigo || "")
        .toLowerCase();


        const ubicacion =
        (p.ubicacion || "")
        .toLowerCase();



        if(

            !nombre.includes(texto) &&

            !codigo.includes(texto) &&

            !ubicacion.includes(texto)

        ){

            return;

        }



        lista.innerHTML += `


        <div class="movimiento">


            <h3>
            📦 ${p.nombre}
            </h3>


            <p>
            <b>🏷 Código:</b>
            ${p.codigo}
            </p>


            <p>
            <b>📊 Stock:</b>
            ${p.stock}
            </p>


            <p>
            <b>📍 Ubicación:</b>
            ${p.ubicacion}
            </p>


            <p>
            <b>💰 Precio:</b>
            ${p.precio} €
            </p>



            <button onclick="editarProducto('${documento.id}')">
            ✏️ Editar
            </button>



            <button onclick="eliminarProducto('${documento.id}')">
            🗑️ Eliminar
            </button>



        </div>


        `;


    });


}



// ==========================
// ABRIR EDICIÓN
// ==========================


async function editarProducto(id) {


    const productos =
    await getDocs(
        collection(db,"productos")
    );



    productos.forEach((documento)=>{


        if(documento.id === id){


            const p =
            documento.data();



            document.getElementById("editarId").value =
            id;


            document.getElementById("editarCodigo").value =
            p.codigo;


            document.getElementById("editarNombre").value =
            p.nombre;


            document.getElementById("editarStock").value =
            p.stock;


            document.getElementById("editarUbicacion").value =
            p.ubicacion;


            document.getElementById("editarPrecio").value =
            p.precio;



            document.getElementById("modalEditar").style.display =
            "flex";


        }


    });


}



// ==========================
// GUARDAR EDICIÓN
// ==========================


async function guardarEdicion() {


    const id =
    document.getElementById("editarId").value;



    try {


        await updateDoc(

            doc(
                db,
                "productos",
                id
            ),

            {

                codigo:
                document.getElementById("editarCodigo").value,


                nombre:
                document.getElementById("editarNombre").value,


                stock:
                Number(
                    document.getElementById("editarStock").value
                ),


                ubicacion:
                document.getElementById("editarUbicacion").value,


                precio:
                Number(
                    document.getElementById("editarPrecio").value
                )

            }

        );



        alert("✅ Producto actualizado");


        cerrarModal();


        mostrarProductos();



    } catch(error) {


        console.error(error);

        alert("Error actualizando producto");


    }


}



// ==========================
// CERRAR MODAL
// ==========================


function cerrarModal(){


    document.getElementById("modalEditar").style.display =
    "none";


}



// ==========================
// ELIMINAR PRODUCTO
// ==========================


async function eliminarProducto(id) {


    const confirmar =
    confirm(
        "¿Seguro que quieres eliminar este producto?"
    );



    if(!confirmar){

        return;

    }



    try {


        await deleteDoc(

            doc(
                db,
                "productos",
                id
            )

        );



        alert("🗑️ Producto eliminado");


        mostrarProductos();



    } catch(error) {


        console.error(error);

        alert("Error al eliminar");


    }


}



// ==========================
// EXPORTAR FUNCIONES
// ==========================


window.guardarProducto = guardarProducto;

window.editarProducto = editarProducto;

window.guardarEdicion = guardarEdicion;

window.cerrarModal = cerrarModal;

window.eliminarProducto = eliminarProducto;



mostrarProductos();



document
.getElementById("buscar")
.addEventListener(
    "input",
    mostrarProductos
);