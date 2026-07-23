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

async function guardarProducto(){


    let codigo =
    document.getElementById("codigo").value.trim();


    let nombre =
    document.getElementById("nombre").value.trim();


    let stock =
    document.getElementById("stock").value.trim();


    let ubicacion =
    document.getElementById("ubicacion").value.trim();


    let precio =
    document.getElementById("precio").value.trim();


    let categoria =
    document.getElementById("categoria").value;



    if(codigo==="" || nombre===""){

        alert("Introduce código y nombre");

        return;

    }



    try{


        await addDoc(
            collection(db,"productos"),
            {

                codigo,

                nombre,

                stock:Number(stock),

                ubicacion,

                precio:Number(precio),

                categoria

            }
        );



        alert("✅ Producto guardado");



        document.getElementById("codigo").value="";
        document.getElementById("nombre").value="";
        document.getElementById("stock").value="";
        document.getElementById("ubicacion").value="";
        document.getElementById("precio").value="";
        document.getElementById("categoria").value="";



        mostrarProductos();



    }catch(error){

        console.error(error);

        alert("Error guardando producto");

    }


}





// ==========================
// MOSTRAR PRODUCTOS
// ==========================


async function mostrarProductos(){


    const lista =
    document.getElementById("lista");


    lista.innerHTML="";



    const datos =
    await getDocs(
        collection(db,"productos")
    );



    const texto =
    document.getElementById("buscar")
    .value
    .toLowerCase();



    const filtro =
    document.getElementById("filtroCategoria")
    .value;



    datos.forEach((documento)=>{


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



        const categoria =
        (p.categoria || "")
        .toLowerCase();





        if(

            !nombre.includes(texto) &&

            !codigo.includes(texto) &&

            !ubicacion.includes(texto) &&

            !categoria.includes(texto)

        ){

            return;

        }





        if(

            filtro !== "" &&

            p.categoria !== filtro

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



        <p>
        <b>📂 Categoría:</b>
        ${p.categoria || "Sin categoría"}
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
// EDITAR PRODUCTO
// ==========================


async function editarProducto(id){



    const datos =
    await getDocs(
        collection(db,"productos")
    );



    datos.forEach((documento)=>{


        if(documento.id===id){


            const p =
            documento.data();



            document.getElementById("editarId").value=id;


            document.getElementById("editarCodigo").value=p.codigo;


            document.getElementById("editarNombre").value=p.nombre;


            document.getElementById("editarStock").value=p.stock;


            document.getElementById("editarUbicacion").value=p.ubicacion;


            document.getElementById("editarPrecio").value=p.precio;


            document.getElementById("editarCategoria").value=
            p.categoria || "";



            document.getElementById("modalEditar").style.display="flex";


        }


    });


}





// ==========================
// GUARDAR EDICION
// ==========================


async function guardarEdicion(){



    const id =
    document.getElementById("editarId").value;



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
            ),


            categoria:
            document.getElementById("editarCategoria").value


        }

    );



    alert("✅ Producto actualizado");


    cerrarModal();


    mostrarProductos();


}






// ==========================
// CERRAR MODAL
// ==========================


function cerrarModal(){

    document.getElementById("modalEditar").style.display="none";

}





// ==========================
// ELIMINAR
// ==========================


async function eliminarProducto(id){


    if(!confirm("¿Eliminar producto?")){

        return;

    }



    await deleteDoc(

        doc(
            db,
            "productos",
            id
        )

    );



    alert("🗑️ Producto eliminado");


    mostrarProductos();


}





window.guardarProducto=guardarProducto;

window.editarProducto=editarProducto;

window.guardarEdicion=guardarEdicion;

window.cerrarModal=cerrarModal;

window.eliminarProducto=eliminarProducto;



mostrarProductos();




document
.getElementById("buscar")
.addEventListener(
"input",
mostrarProductos
);



document
.getElementById("filtroCategoria")
.addEventListener(
"change",
mostrarProductos
);