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
import {FAMILIAS, normalizarFamilia, familiaDe} from "./familias.js";

function familiaCanonica(valor){ return normalizarFamilia(valor); }

function cargarFamilias(){
    ["categoria","editarCategoria"].forEach(id=>{
        const sel=document.getElementById(id);
        if(!sel) return;
        const actual=familiaCanonica(sel.value);
        sel.innerHTML='<option value="">Seleccionar categoría</option>'+
            FAMILIAS.map(f=>`<option value="${f}">${f}</option>`).join("");
        if(FAMILIAS.includes(actual)) sel.value=actual;
    });
}

// ==========================
// GUARDAR PRODUCTO
// ==========================

async function guardarProducto() {

    const codigo = document.getElementById("codigo").value.trim();
    const nombre = document.getElementById("nombre").value.trim();
    const categoria = familiaCanonica(document.getElementById("categoria").value);
    const stock = Number(document.getElementById("stock").value);
    const precio = Number(document.getElementById("precio").value);
    const stockMinimo = Number(document.getElementById("stockMinimo").value) || 5;
    const proveedor = document.getElementById("proveedor").value.trim();
    const formato = document.getElementById("formato").value.trim();

    if (codigo === "" || nombre === "") {

        alert("Introduce el código y el nombre.");
        return;

    }

    if (categoria === "") {

        alert("Selecciona una categoría.");
        return;

    }

    try {

        await addDoc(collection(db, "productos"), {

            codigo,
            nombre,
            categoria,
            familia: categoria,
            stock,
            precio,
            stockMinimo,
            proveedor,
            ubicacion: proveedor,
            formato,
            revisado: false

        });

        alert("✅ Producto guardado");

        document.getElementById("codigo").value = "";
        document.getElementById("nombre").value = "";
        document.getElementById("categoria").value = "";
        document.getElementById("stock").value = "";
        document.getElementById("precio").value = "";
        document.getElementById("stockMinimo").value = 5;
        document.getElementById("proveedor").value = "";
        document.getElementById("formato").value = "";

        cargarFamilias();
mostrarProductos();

    } catch (error) {

        console.error(error);
        alert("Error al guardar");

    }

}

async function normalizarProductosGuardados(){
    const datos=await getDocs(collection(db,"productos"));
    const tareas=[];
    datos.forEach(d=>{
        const p=d.data();
        const f=familiaDe(p);
        if(FAMILIAS.includes(f) && (p.familia!==f || p.categoria!==f)){
            tareas.push(updateDoc(doc(db,"productos",d.id),{familia:f,categoria:f}));
        }
    });
    if(tareas.length) await Promise.all(tareas);
}

// ==========================
// MOSTRAR PRODUCTOS
// ==========================

async function mostrarProductos() {

    const lista = document.getElementById("lista");

    lista.innerHTML = "";

    const datos = await getDocs(collection(db, "productos"));

    const texto = document
        .getElementById("buscar")
        .value
        .toLowerCase();

    let tabla = `

<table class="tabla-productos">

<thead>

<tr>

<th>Código</th>

<th>Producto</th>

<th>Categoría</th>

<th>Stock</th>

<th>Mínimo</th>

<th>Precio</th>

<th>Valor</th>

<th>Estado</th>

<th>Acciones</th>

</tr>

</thead>

<tbody>

`;

    datos.forEach((documento) => {

        const p = documento.data();

        const nombre = (p.nombre || "").toLowerCase();
        const codigo = (p.codigo || "").toLowerCase();
        const categoria = familiaDe(p).toLowerCase();

        if (

            !nombre.includes(texto) &&
            !codigo.includes(texto) &&
            !categoria.includes(texto)

        ) {

            return;

        }

        const stock = Number(p.stock) || 0;
        const minimo = Number(p.stockMinimo ?? 5);
        const precio = Number(p.precio) || 0;

        let clase = "ok";
        let estado = "🟢 Correcto";

        if (stock <= minimo) {

            clase = "bajo";
            estado = "🟠 Bajo";

        }

        if (stock === 0) {

            clase = "sin";
            estado = "🔴 Sin stock";

        }

        if (familiaDe(p) === "Stock de planchas") {

            clase = "ok";
            estado = "—";

        }

        tabla += `

<tr class="${clase}">

<td>${p.codigo}</td>

<td>${p.nombre}</td>

<td>${familiaDe(p)}</td>

<td>${stock}</td>

<td>${familiaDe(p) === "Stock de planchas" ? "-" : minimo}</td>

<td>${precio.toFixed(2)} €</td>

<td>${(stock * precio).toFixed(2)} €</td>

<td>${estado}</td>

<td>

<button onclick="editarProducto('${documento.id}')">

✏️

</button>

<button onclick="eliminarProducto('${documento.id}')">

🗑️

</button>

</td>

</tr>

`;

    });

    tabla += `

</tbody>

</table>

`;

    lista.innerHTML = tabla;

}

// ==========================
// EDITAR PRODUCTO
// ==========================

async function editarProducto(id) {

    const datos = await getDocs(collection(db, "productos"));

    datos.forEach((documento) => {

        if (documento.id === id) {

            const p = documento.data();

            document.getElementById("editarId").value = id;
            document.getElementById("editarCodigo").value = p.codigo;
            document.getElementById("editarNombre").value = p.nombre;
            document.getElementById("editarCategoria").value = familiaCanonica(p.familia || p.categoria || "");
            document.getElementById("editarStock").value = p.stock;
            document.getElementById("editarPrecio").value = p.precio;
            document.getElementById("editarStockMinimo").value = p.stockMinimo ?? 5;
            document.getElementById("editarProveedor").value = p.proveedor || p.ubicacion || "";
            document.getElementById("editarFormato").value = p.formato || "";

            document.getElementById("modalEditar").style.display = "flex";

        }

    });

}

// ==========================
// GUARDAR EDICIÓN
// ==========================

async function guardarEdicion() {

    const id = document.getElementById("editarId").value;

    try {

        await updateDoc(

            doc(db, "productos", id),

            {

                codigo: document.getElementById("editarCodigo").value,
                nombre: document.getElementById("editarNombre").value,
                categoria: familiaCanonica(document.getElementById("editarCategoria").value),
                familia: familiaCanonica(document.getElementById("editarCategoria").value),
                stock: Number(document.getElementById("editarStock").value),
                precio: Number(document.getElementById("editarPrecio").value),
                stockMinimo: Number(document.getElementById("editarStockMinimo").value) || 5,
                proveedor: document.getElementById("editarProveedor").value.trim(),
                ubicacion: document.getElementById("editarProveedor").value.trim(),
                formato: document.getElementById("editarFormato").value.trim()

            }

        );

        alert("✅ Producto actualizado");

        cerrarModal();

        mostrarProductos();

    } catch (error) {

        console.error(error);

        alert("Error al actualizar");

    }

}

// ==========================
// CERRAR MODAL
// ==========================

function cerrarModal() {

    document.getElementById("modalEditar").style.display = "none";

}

// ==========================
// ELIMINAR
// ==========================

async function eliminarProducto(id) {

    if (!confirm("¿Eliminar este producto?")) return;

    try {

        await deleteDoc(doc(db, "productos", id));

        alert("🗑️ Producto eliminado");

        mostrarProductos();

    } catch (error) {

        console.error(error);

        alert("Error al eliminar");

    }

}


// ==========================
// DUPLICADOS - SELECCIÓN MANUAL
// ==========================
const CODIGOS_AGOSTO=new Set(["PF0000415", "PF000100", "PF000101", "PF000103", "PF000106", "PF000107", "PF000108", "PF000109", "PF000111", "PF000112", "PF000113", "PF000114", "PF000115", "PF000116", "PF000117", "PF000118", "PF000121", "PF000122", "PF000123", "PF000126", "PF000132", "PF000133", "PF000134", "PF000135", "PF000136", "PF000138", "PF000139", "PF000140", "PF000141", "PF000142", "PF000143", "PF000144", "PF000145", "PF000146", "PF000147", "PF000148", "PF000149", "PF000150", "PF000151", "PF000152", "PF000154", "PF000415", "PF000996", "PF000999", "PF001037", "PF001381", "PF001385", "PF001386", "PF001387", "PF001388", "PF001391", "PF001393", "PF001407", "PF001409", "PF001553", "PF001619", "PF001814", "PF002205", "PF002313", "PF002386", "PF002390", "PF002396", "PF002623", "PF002710", "PF002798", "PF002800", "PF003168", "PF004220", "PF004645", "PF004750", "PF004933", "PF005104", "PF005333", "PF005499", "PF005602", "PF005613", "PF005864", "PF006118", "PF007114", "PF00719", "PF007245", "PF007860", "PF007861", "PF008460", "PF008695", "PF008819", "PF009021", "PF009541", "PF009542", "PF010122", "TA000103", "TA000128", "TA000137", "TA000153", "TA000275", "TA000383", "TA000384", "TA000415", "TA000416", "TA000418", "TA000420", "TA000421", "TA000422", "TA000427", "TA000428", "TA000429", "TA000430", "TA000431", "TA000432", "TA000433", "TA000434", "TA000439", "TA000441", "TA000453", "TA000473", "TA000475", "TA000495", "TA000524", "TA000539", "TA000541", "TA000542", "TA000543", "TA000594", "TA000639", "TA000647", "TA000648", "TA000649", "TA000650", "TA000651", "TA000712", "TA000728", "TA001280", "TA001300", "TA001301", "TA001302", "TA001303", "TA001304", "TA001305", "TA001306", "TA001307", "TA001308", "TA001309", "TA001310", "TA001311", "TA001312", "TA001313", "TA001314", "TA001315", "TA001329", "TA001330", "TA001331", "TA001332", "TA001333", "TA001558", "TA002299", "TA002300", "TA002301", "TA002439", "TA002440", "TA002503", "TA002504", "TA002572", "TA002942", "TA002964", "TA002965", "TA003080", "TA003113", "TA003166", "TA003192", "TA003941", "TA003942", "TA003943", "TA003944", "TA004108", "TA004161", "TA004225", "TA004226", "TA004252", "TA004628"]);

function claveCodigo(v){
    return String(v??"").trim().toUpperCase().replace(/\s+/g,"");
}
function claveNombre(v){
    return String(v??"").trim().toUpperCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^A-Z0-9]+/g," ").trim().replace(/\s+/g," ");
}
function etiquetaOrigen(p){
    const o=String(p.origenExcel||p.origen||p.importacion||"").toUpperCase();
    const c=claveCodigo(p.codigo||p.referencia||p.ref||"");
    if(o.includes("AGOSTO") || CODIGOS_AGOSTO.has(c)) return "📘 Agosto";
    return "🆕 Posterior / no identificado como agosto";
}

async function analizarDuplicadosManual(){
    const out=document.getElementById("resultadoDuplicados");
    const borrar=    out.innerHTML="Buscando duplicados en todas las categorías...";
    borrar.disabled=true;

    try{
        const snap=await getDocs(collection(db,"productos"));
        const grupos=new Map();

        snap.forEach(d=>{
            const p={id:d.id,...d.data()};
            const c=claveCodigo(p.codigo||p.referencia||p.ref||"");
            const n=claveNombre(p.nombre||p.descripcion||"");
            const clave=c ? "C:"+c : (n ? "N:"+n : "");
            if(!clave) return;
            if(!grupos.has(clave)) grupos.set(clave,[]);
            grupos.get(clave).push(p);
        });

        const duplicados=[...grupos.entries()].filter(([,a])=>a.length>1);
        if(!duplicados.length){
            out.innerHTML=`<strong>✅ ${snap.size} productos revisados. No hay duplicados exactos por referencia o nombre.</strong>`;
            return;
        }

        out.innerHTML=`
          <p><strong>${duplicados.length} grupos duplicados encontrados.</strong> No se borrará nada que no marques tú.</p>
          ${duplicados.map(([clave,items],gi)=>`
            <div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin:14px 0">
              <h3 style="margin-top:0">Referencia / producto: ${clave.substring(2)}</h3>
              <div style="overflow-x:auto">
              <table class="tabla-productos">
                <thead><tr>
                  <th>Eliminar</th><th>Origen</th><th>Referencia</th><th>Producto</th>
                  <th>Categoría</th><th>Stock</th><th>Precio</th><th>Proveedor</th><th>Formato</th>
                </tr></thead>
                <tbody>
                ${items.map(p=>`
                  <tr>
                    <td><input type="checkbox" class="duplicado-borrar" data-id="${p.id}" data-grupo="${gi}"></td>
                    <td>${etiquetaOrigen(p)}</td>
                    <td><strong>${p.codigo||p.referencia||p.ref||""}</strong></td>
                    <td>${p.nombre||p.descripcion||""}</td>
                    <td>${familiaDe(p)||p.categoria||""}</td>
                    <td>${Number(p.stock)||0}</td>
                    <td>${(Number(p.precio)||0).toFixed(2)} €</td>
                    <td>${p.proveedor||p.ubicacion||""}</td>
                    <td>${p.formato||""}</td>
                  </tr>`).join("")}
                </tbody>
              </table></div>
            </div>`).join("")}`;

        document.querySelectorAll(".duplicado-borrar").forEach(ch=>{
            ch.addEventListener("change",()=>{
                const marcados=document.querySelectorAll(".duplicado-borrar:checked").length;
                borrar.disabled=marcados===0;
            });
        });
    }catch(e){
        console.error(e);
        out.innerHTML="❌ Error al buscar duplicados.";
    }
}

async function eliminarDuplicadosSeleccionados(){
    const checks=[...document.querySelectorAll(".duplicado-borrar:checked")];
    if(!checks.length) return;

    // Seguridad: nunca permitir borrar todos los registros de un mismo grupo.
    const todos=[...document.querySelectorAll(".duplicado-borrar")];
    const grupos={};
    todos.forEach(c=>{
        const g=c.dataset.grupo;
        if(!grupos[g]) grupos[g]={total:0,marcados:0};
        grupos[g].total++;
        if(c.checked) grupos[g].marcados++;
    });
    const invalido=Object.values(grupos).some(g=>g.marcados>0 && g.marcados>=g.total);
    if(invalido){
        alert("⚠️ En cada grupo debe quedar al menos un producto. Desmarca uno para conservarlo.");
        return;
    }

    if(!confirm(`Vas a eliminar ${checks.length} registro(s) que has marcado manualmente. ¿Continuar?`)) return;

    try{
        await Promise.all(checks.map(c=>deleteDoc(doc(db,"productos",c.dataset.id))));
        alert(`✅ Eliminados ${checks.length} registro(s) seleccionados.`);
        await normalizarProductosGuardados();
        await mostrarProductos();
        await analizarDuplicadosManual();
    }catch(e){
        console.error(e);
        alert("❌ Error al eliminar los seleccionados.");
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

// ==========================
// INICIO
// ==========================

cargarFamilias();
normalizarProductosGuardados().then(mostrarProductos).catch(e=>{console.error(e);mostrarProductos();});

document
    .getElementById("buscar")
    .addEventListener("input", mostrarProductos);

// ==========================
// LIMPIEZA DEFINITIVA: ENVASES Y EMBALAJE
// Fuente: "envases y embalaje.xlsx" del usuario.
// Solo afecta a esta familia.
// ==========================
const ENVASES_DEFINITIVOS=[{"nombre": "8x12", "aliases": ["8x12", "BOLSAS"]}, {"nombre": "6x8", "aliases": ["6x8"]}, {"nombre": "12x18", "aliases": ["12x18"]}, {"nombre": "18x27", "aliases": ["18x27"]}, {"nombre": "22x32", "aliases": ["22x32"]}, {"nombre": "30x40", "aliases": ["30x40"]}, {"nombre": "35x45", "aliases": ["35x45"]}, {"nombre": "25x35", "aliases": ["25x35"]}, {"nombre": "15x22", "aliases": ["15x22"]}, {"nombre": "sacos pequeños", "aliases": ["sacos pequeños"]}, {"nombre": "Sacos aspirador grandes", "aliases": ["Sacos aspirador grandes"]}, {"nombre": "16X22", "aliases": ["16X22"]}, {"nombre": "Sacos grandes 160x69 (polipropileno)", "aliases": ["Sacos grandes 160x69 (polipropileno)"]}, {"nombre": "Bolsas basket 600 (61x48)", "aliases": ["Bolsas basket 600 (61x48)"]}, {"nombre": "Bolsas 30x30", "aliases": ["Bolsas 30x30"]}, {"nombre": "Sobre Kraft 37x24", "aliases": ["Sobre Kraft 37x24"]}, {"nombre": "Sobre Kraft 33x26", "aliases": ["Sobre Kraft 33x26"]}, {"nombre": "Tubo LDPE (envasado esterillas)", "aliases": ["Tubo LDPE (envasado esterillas)"]}, {"nombre": "45 CM retractil", "aliases": ["45 CM retractil", "RETRACTIL"]}, {"nombre": "FILM MANO", "aliases": ["FILM MANO"]}, {"nombre": "FILM GRANDE TRANPARENTE", "aliases": ["FILM GRANDE TRANPARENTE", "GRANDE TRANPARNTE", "GRANDE TRANSPARENTE"]}, {"nombre": "FILM GRANDE NEGRO", "aliases": ["FILM GRANDE NEGRO", "GRANDE NEGRO"]}, {"nombre": "FLEJE PALETIZAR", "aliases": ["FLEJE PALETIZAR", "PALETIZAR"]}, {"nombre": "GRAPA FLEJE", "aliases": ["GRAPA FLEJE"]}, {"nombre": "PALET 120X80 CM", "aliases": ["PALET 120X80 CM", "PALETS"]}, {"nombre": "PAPEL ENVASADO", "aliases": ["PAPEL ENVASADO", "VARIOS"]}, {"nombre": "Barras de silicona pequeña", "aliases": ["Barras de silicona pequeña"]}, {"nombre": "Barras de silicona grandes", "aliases": ["Barras de silicona grandes"]}, {"nombre": "Spray SIL-130 S LUMASER (lubricante)", "aliases": ["Spray SIL-130 S LUMASER (lubricante)"]}, {"nombre": "Desengrasante AUT-360 LUMASER", "aliases": ["Desengrasante AUT-360 LUMASER"]}, {"nombre": "Gomas elásticas", "aliases": ["Gomas elásticas"]}, {"nombre": "Cinta adhesiva SCOTECH", "aliases": ["Cinta adhesiva SCOTECH"]}, {"nombre": "AGUA DESTILADA", "aliases": ["AGUA DESTILADA"]}, {"nombre": "AGUA REFRIGERANTE DE 25L A 10%", "aliases": ["AGUA REFRIGERANTE DE 25L A 10%"]}, {"nombre": "Arandelas Bouchones", "aliases": ["Arandelas Bouchones"]}, {"nombre": "105MM MUESTRARIO TORNILLOS", "aliases": ["105MM MUESTRARIO TORNILLOS", "105MM"]}, {"nombre": "100M MUESTRARIO TORNILLOS", "aliases": ["100M MUESTRARIO TORNILLOS", "100M"]}, {"nombre": "30M MUESTRARIO TORNILLOS", "aliases": ["30M MUESTRARIO TORNILLOS", "30MM MUESTRARIO TORNILLOS"]}, {"nombre": "TAPÓN METÁLICO MUESTRARIO", "aliases": ["TAPÓN METÁLICO MUESTRARIO", "TAPÓN METÁLICO"]}, {"nombre": "20MM METAL PROLONGADOR", "aliases": ["20MM METAL PROLONGADOR", "20MM METAL", "20MM"]}, {"nombre": "10MM PROLONGADOR METAL", "aliases": ["10MM PROLONGADOR METAL"]}, {"nombre": "30MM PROLONGADOR METAL", "aliases": ["30MM PROLONGADOR METAL", "PROLONGADORES METÁLICOS"]}, {"nombre": "TORNILLOS PLASTICOS 70MM", "aliases": ["TORNILLOS PLASTICOS 70MM", "TORNILLOS PLASTICOS"]}, {"nombre": "90MM", "aliases": ["90MM"]}, {"nombre": "40MM", "aliases": ["40MM"]}, {"nombre": "TAPÓN PLÁSTICO", "aliases": ["TAPÓN PLÁSTICO"]}];

function normalizarEnvases(v){
 return String(v??"").trim().toUpperCase().normalize("NFD")
   .replace(/[\u0300-\u036f]/g,"").replace(/[^A-Z0-9]+/g," ").trim().replace(/\s+/g," ");
}
function textoProductoEnvases(p){
 return normalizarEnvases([
   p.codigo,p.referencia,p.ref,p.nombre,p.descripcion,p.formato,p.proveedor,p.ubicacion
 ].filter(Boolean).join(" "));
}
function coincideEnvase(p,item){
 const t=textoProductoEnvases(p);
 return item.aliases.some(a=>{
   const x=normalizarEnvases(a);
   return x && (t===x || t.includes(x));
 });
}
function calidadEnvase(p,item){
 const t=textoProductoEnvases(p), objetivo=normalizarEnvases(item.nombre);
 let s=0;
 if(t===objetivo) s+=100;
 if(normalizarEnvases(p.nombre)===objetivo) s+=80;
 if(normalizarEnvases(p.codigo||p.referencia||p.ref)===objetivo) s+=60;
 if(p.stock!==undefined && p.stock!==null && p.stock!=="") s+=5;
 if(p.precio!==undefined && p.precio!==null && p.precio!=="") s+=5;
 return s;
}

async function limpiarEnvasesDirecto(){
 const out=document.getElementById("resultadoLimpiezaEnvases");
 if(!confirm("Se limpiará SOLO la categoría Envases y embalaje. Quedará una sola ficha por cada artículo del Excel definitivo y se borrarán duplicados/sobrantes. ¿Continuar?")) return;
 out.innerHTML="Limpiando Envases y embalaje...";
 try{
   const snap=await getDocs(collection(db,"productos"));
   const envases=snap.docs.map(d=>({id:d.id,...d.data()}))
     .filter(p=>familiaDe(p)==="Envases y embalaje");

   const usados=new Set(), conservar=new Set(), faltan=[];
   // Asignación en el mismo orden del Excel. Cada ficha actual solo puede conservarse una vez.
   for(const item of ENVASES_DEFINITIVOS){
     const candidatos=envases.filter(p=>!usados.has(p.id) && coincideEnvase(p,item))
       .sort((a,b)=>calidadEnvase(b,item)-calidadEnvase(a,item));
     if(candidatos.length){
       conservar.add(candidatos[0].id);
       usados.add(candidatos[0].id);
     } else {
       faltan.push(item.nombre);
     }
   }

   const eliminar=envases.filter(p=>!conservar.has(p.id));
   await Promise.all(eliminar.map(p=>deleteDoc(doc(db,"productos",p.id))));
   await normalizarProductosGuardados();
   await mostrarProductos();

   out.innerHTML=`<strong>✅ Limpieza terminada.</strong><br>
     Registros de Envases antes: ${envases.length}<br>
     Artículos conservados: ${conservar.size}<br>
     Duplicados/sobrantes eliminados: ${eliminar.length}<br>
     ${faltan.length?`<br><strong>⚠️ Artículos del Excel que no existían en Firebase (${faltan.length}):</strong><br>${faltan.join("<br>")}`:"<br><strong>Los 46 artículos del Excel están representados.</strong>"}`;
 }catch(e){
   console.error(e);
   out.innerHTML="❌ Error durante la limpieza. No se ha tocado ninguna otra categoría.";
 }
}
document.getElementById("limpiarEnvasesDirecto")?.addEventListener("click",limpiarEnvasesDirecto);
