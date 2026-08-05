import {
    db,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs
} from "./firebase.js";


const empresa =
document.getElementById("empresa");

const responsable =
document.getElementById("responsable");

const telefono =
document.getElementById("telefono");

const email =
document.getElementById("email");

const iva =
document.getElementById("iva");

const stockMinimo =
document.getElementById("stockMinimo");


const guardarBtn =
document.getElementById("guardar");



// ==========================
// CARGAR
// ==========================


async function cargar(){


try{


const ref =
doc(
db,
"configuracion",
"empresa"
);



const datos =
await getDoc(ref);



if(datos.exists()){


const c =
datos.data();


empresa.value =
c.empresa || "";


responsable.value =
c.responsable || "";


telefono.value =
c.telefono || "";


email.value =
c.email || "";


iva.value =
c.iva ?? 21;


stockMinimo.value =
c.stockMinimo ?? 5;


}



}catch(error){

console.error(error);

}


}







// ==========================
// GUARDAR
// ==========================


guardarBtn.onclick = async()=>{


guardarBtn.disabled=true;

guardarBtn.textContent="Guardando...";


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
email.value.trim(),


iva:
Number(iva.value)||21,


stockMinimo:
Number(stockMinimo.value)||5



}

);



alert(
"✅ Configuración guardada"
);



}catch(error){


console.error(error);


alert(
"Error guardando configuración"
);



}finally{


guardarBtn.disabled=false;

guardarBtn.textContent=
"💾 Guardar configuración";


}


};








// ==========================
// BACKUP
// ==========================


document
.getElementById("backup")
.onclick=async()=>{


const productos =
await getDocs(
collection(db,"productos")
);


const movimientos =
await getDocs(
collection(db,"movimientos")
);



const backup={


fecha:
new Date(),


productos:
productos.docs.map(
d=>d.data()
),


movimientos:
movimientos.docs.map(
d=>d.data()
)


};



const blob =
new Blob(

[
JSON.stringify(
backup,
null,
2
)
],

{
type:"application/json"
}

);



const url =
URL.createObjectURL(blob);


const a =
document.createElement("a");


a.href=url;

a.download=
"backup_inventario_pro.json";


a.click();


};






// ==========================
// RESTAURAR
// ==========================


document
.getElementById("restaurar")
.onclick=()=>{


document
.getElementById("archivoBackup")
.click();


};





document
.getElementById("archivoBackup")
.onchange=(e)=>{


const archivo =
e.target.files[0];


if(!archivo)return;


const lector =
new FileReader();


lector.onload=()=>{


console.log(
JSON.parse(
lector.result
)
);


alert(
"Backup cargado correctamente. Preparado para restauración."
);


};


lector.readAsText(archivo);


};





cargar();