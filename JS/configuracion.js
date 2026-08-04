import {
    db,
    doc,
    getDoc,
    setDoc
} from "./firebase.js";

const empresa =
document.getElementById("empresa");

const responsable =
document.getElementById("responsable");

const telefono =
document.getElementById("telefono");

const email =
document.getElementById("email");

const guardarBtn =
document.getElementById("guardar");

// ==========================
// CARGAR CONFIGURACIÓN
// ==========================

async function cargar(){

    try{

        const documento =
        await getDoc(
            doc(
                db,
                "configuracion",
                "empresa"
            )
        );

        if(documento.exists()){

            const datos =
            documento.data();

            empresa.value =
            datos.empresa || "";

            responsable.value =
            datos.responsable || "";

            telefono.value =
            datos.telefono || "";

            email.value =
            datos.email || "";

        }

    }catch(error){

        console.error(error);

        alert(
            "Error al cargar la configuración."
        );

    }

}

// ==========================
// GUARDAR
// ==========================

guardarBtn.addEventListener(
    "click",
    guardar
);

async function guardar(){

    if(
        empresa.value.trim()===""
    ){

        alert(
            "Introduce el nombre de la empresa."
        );

        empresa.focus();

        return;

    }

    guardarBtn.disabled = true;

    guardarBtn.textContent =
    "Guardando...";

    try{

        await setDoc(

            doc(
                db,
                "configuracion",
                "empresa"
            ),

            {

                empresa:
                empresa.value.trim(),

                responsable:
                responsable.value.trim(),

                telefono:
                telefono.value.trim(),

                email:
                email.value.trim()

            }

        );

        alert(
            "✅ Configuración guardada correctamente"
        );

    }catch(error){

        console.error(error);

        alert(
            "Error al guardar la configuración."
        );

    }finally{

        guardarBtn.disabled = false;

        guardarBtn.textContent =
        "💾 Guardar configuración";

    }

}

// ==========================
// INICIO
// ==========================

cargar();