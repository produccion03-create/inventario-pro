import {
    db,
    doc,
    getDoc,
    setDoc
} from "./firebase.js";

const empresa = document.getElementById("empresa");
const responsable = document.getElementById("responsable");
const telefono = document.getElementById("telefono");
const email = document.getElementById("email");

async function cargar() {

    const documento =
    await getDoc(
        doc(db,"configuracion","empresa")
    );

    if(documento.exists()){

        const datos = documento.data();

        empresa.value = datos.empresa || "";
        responsable.value = datos.responsable || "";
        telefono.value = datos.telefono || "";
        email.value = datos.email || "";

    }

}

document
.getElementById("guardar")
.addEventListener("click",guardar);

async function guardar(){

    await setDoc(

        doc(db,"configuracion","empresa"),

        {

            empresa:empresa.value,

            responsable:responsable.value,

            telefono:telefono.value,

            email:email.value

        }

    );

    alert("✅ Configuración guardada");

}

cargar();