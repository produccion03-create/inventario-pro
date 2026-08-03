import {
    db,
    collection,
    getDocs,
    query,
    where,
    addDoc,
    serverTimestamp
} from "./firebase.js";

let productoActual = null;

async function encontrado(decodedText) {

    const codigo = decodedText;

    const consulta = query(
        collection(db, "productos"),
        where("codigo", "==", codigo)
    );

    const datos = await getDocs(consulta);

    if (datos.empty) {

        document.getElementById("producto").innerHTML =
        "<h2>❌ Producto no encontrado</h2>";

        return;

    }

    datos.forEach((documento)=>{

        productoActual = {

            id: documento.id,

            ...documento.data()

        };

    });

    document.getElementById("producto").innerHTML = `

        <h2>${productoActual.nombre}</h2>

        <p><b>Código:</b> ${productoActual.codigo}</p>

        <p><b>Categoría:</b> ${productoActual.categoria}</p>

    `;

    document.getElementById("stockSistema").textContent =
    productoActual.stock;

    document.getElementById("stockContado").value =
    productoActual.stock;

}

document
.getElementById("guardarConteo")
.addEventListener("click", guardarConteo);



async function guardarConteo(){

    if(!productoActual){

        alert("Escanea primero un producto");

        return;

    }

    const contado =
    Number(
        document.getElementById("stockContado").value
    );

    const diferencia =
    contado - Number(productoActual.stock);

    await addDoc(

        collection(db,"inventario"),

        {

            codigo: productoActual.codigo,

            producto: productoActual.nombre,

            categoria: productoActual.categoria,

            stockSistema: Number(productoActual.stock),

            stockContado: contado,

            diferencia: diferencia,

            fecha: serverTimestamp()

        }

    );

    alert("✅ Conteo guardado");

    document.getElementById("producto").innerHTML =
    "Esperando escaneo...";

    document.getElementById("stockSistema").textContent =
    "0";

    document.getElementById("stockContado").value =
    0;

    productoActual = null;

}

const scanner = new Html5QrcodeScanner(

    "lector",

    {

        fps:10,

        qrbox:250

    }

);

scanner.render(encontrado);