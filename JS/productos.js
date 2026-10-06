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

// ======================================================
// ENVASES Y EMBALAJE: LISTA DEFINITIVA + PRECIOS DEL EXCEL
// - Solo afecta a "Envases y embalaje"
// - Conserva el stock actual del registro que se queda
// - Actualiza SOLO precio
// - Elimina duplicados y artículos que no están en el Excel
// ======================================================
const ENVASES_EXCEL=[{"nombre": "8x12", "grupo": "BOLSAS", "tipo": "POLIPROPILENO", "precio": 0.03, "orden": 0}, {"nombre": "6x8", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.03, "orden": 1}, {"nombre": "12x18", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.04, "orden": 2}, {"nombre": "18x27", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.05, "orden": 3}, {"nombre": "22x32", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.05, "orden": 4}, {"nombre": "30x40", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.06, "orden": 5}, {"nombre": "35x45", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.06, "orden": 6}, {"nombre": "25x35", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.05, "orden": 7}, {"nombre": "15x22", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.05, "orden": 8}, {"nombre": "sacos pequeños", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.3, "orden": 9}, {"nombre": "Sacos aspirador grandes", "grupo": "", "tipo": "POLIPROPILENO", "precio": 2, "orden": 10}, {"nombre": "16X22", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.05, "orden": 11}, {"nombre": "Sacos grandes 160x69 (polipropileno)", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.3, "orden": 12}, {"nombre": "Bolsas basket 600 (61x48)", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.1, "orden": 13}, {"nombre": "Bolsas 30x30", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.109, "orden": 14}, {"nombre": "Sobre Kraft 37x24", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.15, "orden": 15}, {"nombre": "Sobre Kraft 33x26", "grupo": "", "tipo": "POLIPROPILENO", "precio": 0.15, "orden": 16}, {"nombre": "Tubo LDPE (envasado esterillas)", "grupo": "", "tipo": "POLIPROPILENO", "precio": 45, "orden": 17}, {"nombre": "45 CM", "grupo": "RETRACTIL", "tipo": "BOBINA", "precio": 50, "orden": 18}, {"nombre": "MANO", "grupo": "FILM", "tipo": "PLASTICO ROLLO", "precio": 0.95, "orden": 19}, {"nombre": "GRANDE TRANPARNTE", "grupo": "", "tipo": "PLASTICO ROLLO", "precio": 3.86, "orden": 20}, {"nombre": "GRANDE NEGRO", "grupo": "", "tipo": "PLASTICO ROLLO", "precio": 3.86, "orden": 21}, {"nombre": "FLEJE PALETIZAR", "grupo": "PALETIZAR", "tipo": "ROLLO", "precio": 60, "orden": 22}, {"nombre": "GRAPA FLEJE", "grupo": "", "tipo": "UNIDAD", "precio": 0.05, "orden": 23}, {"nombre": "PALET 120X80 CM", "grupo": "PALETS", "tipo": "", "precio": 5.5, "orden": 24}, {"nombre": "PAPEL ENVASADO", "grupo": "VARIOS", "tipo": "", "precio": 0.32, "orden": 25}, {"nombre": "Barras de silicona pequeña", "grupo": "", "tipo": "", "precio": 0.08, "orden": 26}, {"nombre": "Barras de silicona grandes", "grupo": "", "tipo": "", "precio": 0.08, "orden": 27}, {"nombre": "Spray SIL-130 S LUMASER (lubricante)", "grupo": "", "tipo": "BOTES", "precio": 5, "orden": 28}, {"nombre": "Desengrasante AUT-360 LUMASER", "grupo": "", "tipo": "GARRAFA 25L", "precio": 93.75, "orden": 29}, {"nombre": "Gomas elásticas", "grupo": "", "tipo": "", "precio": 0.0107142857142857, "orden": 30}, {"nombre": "Cinta adhesiva SCOTECH", "grupo": "", "tipo": "ROLLOS", "precio": 1.69875, "orden": 31}, {"nombre": "AGUA DESTILADA", "grupo": "", "tipo": "", "precio": 0, "orden": 32}, {"nombre": "AGUA REFRIGERANTE DE 25L A 10%", "grupo": "", "tipo": "", "precio": 0, "orden": 33}, {"nombre": "Arandelas Bouchones", "grupo": "", "tipo": "UD", "precio": 0.03041, "orden": 34}, {"nombre": "105MM", "grupo": "MUESTRARIO TORNILLOS METÁLICOS", "tipo": "METAL", "precio": 0.00671, "orden": 35}, {"nombre": "100M", "grupo": "", "tipo": "METAL", "precio": 0.016059999999999998, "orden": 36}, {"nombre": "30MM", "grupo": "", "tipo": "METAL", "precio": 0.016059999999999998, "orden": 37}, {"nombre": "TAPÓN METÁLICO", "grupo": "", "tipo": "METAL", "precio": 0.02, "orden": 38}, {"nombre": "20MM", "grupo": "PROLONGADORES METÁLICOS", "tipo": "METAL", "precio": 0.016059999999999998, "orden": 39}, {"nombre": "10MM", "grupo": "", "tipo": "METAL", "precio": 0.00671, "orden": 40}, {"nombre": "30MM", "grupo": "", "tipo": "METAL", "precio": 0.016059999999999998, "orden": 41}, {"nombre": "70MM", "grupo": "TORNILLOS PLASTICOS", "tipo": "PLÁSTICO", "precio": 0.00671, "orden": 42}, {"nombre": "90MM", "grupo": "", "tipo": "PLÁSTICO", "precio": 0.016059999999999998, "orden": 43}, {"nombre": "40MM", "grupo": "", "tipo": "PLÁSTICO", "precio": 0.016059999999999998, "orden": 44}, {"nombre": "TAPÓN PLÁSTICO", "grupo": "", "tipo": "PLÁSTICO", "precio": 0.001, "orden": 45}];

function normEnv(v){
 return String(v??"").trim().toUpperCase().normalize("NFD")
   .replace(/[\u0300-\u036f]/g,"").replace(/[^A-Z0-9]+/g," ").trim().replace(/\s+/g," ");
}
function camposEnv(p){
 return [p.codigo,p.referencia,p.ref,p.nombre,p.descripcion,p.formato,p.proveedor,p.ubicacion]
   .filter(Boolean).map(normEnv);
}
function scoreEnv(p,it){
 const objetivo=normEnv(it.nombre), grupo=normEnv(it.grupo), tipo=normEnv(it.tipo);
 const campos=camposEnv(p);
 let s=0;
 // Prioridad: coincidencia exacta con el nombre de la fila del Excel.
 for(const c of campos){
   if(c===objetivo) s=Math.max(s,1000);
   else if(c.includes(objetivo) || objetivo.includes(c)) s=Math.max(s,500);
 }
 const todo=campos.join(" ");
 if(grupo && todo.includes(grupo)) s+=80;
 if(tipo && todo.includes(tipo)) s+=40;

 // Casos jerárquicos del Excel que en Firebase aparecen con el contexto del grupo.
 if(grupo==="RETRACTIL" && objetivo==="45 CM" && todo.includes("RETRACTIL")) s+=500;
 if(grupo==="FILM" && objetivo==="MANO" && todo.includes("FILM") && todo.includes("MANO")) s+=500;
 if(grupo==="FILM" && objetivo==="GRANDE TRANPARNTE" && todo.includes("GRANDE") && (todo.includes("TRANPARNTE")||todo.includes("TRANPARENTE"))) s+=500;
 if(grupo==="FILM" && objetivo==="GRANDE NEGRO" && todo.includes("GRANDE NEGRO")) s+=500;
 if(grupo==="PALETIZAR" && objetivo==="FLEJE PALETIZAR" && todo.includes("PALETIZAR")) s+=500;
 if(grupo==="PALETS" && objetivo==="PALET 120X80 CM" && todo.includes("PALET")) s+=500;
 if(grupo==="MUESTRARIO TORNILLOS METALICOS" && ["105MM","100M","30MM","TAPON METALICO"].includes(objetivo) && todo.includes(objetivo)) s+=500;
 if(grupo==="PROLONGADORES METALICOS" && ["20MM","10MM","30MM"].includes(objetivo) && todo.includes(objetivo)) s+=500;
 if(grupo==="TORNILLOS PLASTICOS" && ["70MM","90MM","40MM","TAPON PLASTICO"].includes(objetivo) && todo.includes(objetivo)) s+=500;
 return s;
}

async function aplicarEnvasesExcel(){
 const out=document.getElementById("resultadoEnvasesExcel");
 if(!confirm("Se modificará SOLO Envases y embalaje: se conservará el stock actual, se pondrán los precios del Excel y se eliminarán duplicados/sobrantes. ¿Continuar?")) return;
 out.innerHTML="Aplicando el Excel de Envases y embalaje...";
 try{
   const snap=await getDocs(collection(db,"productos"));
   const actuales=snap.docs.map(d=>({id:d.id,...d.data()}))
      .filter(p=>familiaDe(p)==="Envases y embalaje");

   const usados=new Set();
   const conservar=[];
   const faltan=[];

   for(const it of ENVASES_EXCEL){
      const candidatos=actuales
        .filter(p=>!usados.has(p.id))
        .map(p=>({p,s:scoreEnv(p,it)}))
        .filter(x=>x.s>=500)
        .sort((a,b)=>b.s-a.s);

      if(!candidatos.length){
        faltan.push(it.nombre);
        continue;
      }
      const elegido=candidatos[0].p;
      usados.add(elegido.id);
      conservar.push({p:elegido,it});
   }

   // Seguridad: no ejecutar una limpieza destructiva si no se reconocen todos los artículos.
   if(faltan.length){
      out.innerHTML=`<strong>⚠️ No se ha borrado ni modificado nada.</strong><br>
        No he podido identificar ${faltan.length} artículo(s) del Excel en Firebase:<br>${faltan.join("<br>")}`;
      return;
   }

   const idsConservar=new Set(conservar.map(x=>x.p.id));
   const borrar=actuales.filter(p=>!idsConservar.has(p.id));

   // Actualiza ÚNICAMENTE precio en los 46 registros conservados.
   await Promise.all(conservar.map(x=>
      updateDoc(doc(db,"productos",x.p.id),{precio:Number(x.it.precio)||0})
   ));
   // Elimina duplicados y sobrantes SOLO de esta familia.
   await Promise.all(borrar.map(p=>deleteDoc(doc(db,"productos",p.id))));

   await mostrarProductos();

   const valor=conservar.reduce((s,x)=>s+(Number(x.p.stock)||0)*(Number(x.it.precio)||0),0);
   out.innerHTML=`<strong>✅ Envases y embalaje corregido.</strong><br>
      Artículos definitivos: 46<br>
      Duplicados/sobrantes eliminados: ${borrar.length}<br>
      Stocks modificados: 0<br>
      Precios actualizados desde el Excel: 46<br>
      Valor recalculado con stock actual × precio nuevo: ${valor.toLocaleString("es-ES",{style:"currency",currency:"EUR"})}`;
 }catch(e){
   console.error(e);
   out.innerHTML="❌ Error al aplicar la corrección. No se ha tocado ninguna otra categoría.";
 }
}
document.getElementById("aplicarEnvasesExcel")?.addEventListener("click",aplicarEnvasesExcel);
