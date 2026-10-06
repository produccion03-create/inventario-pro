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
// ORDEN ORIGINAL DE AGOSTO
// ==========================
const ORDEN_AGOSTO={"Stock de planchas": {"TA003166": 0, "N:EVA BLANCO 13": 1, "TA000728": 2, "TA001300": 3, "TA000539": 4, "TA001301": 5, "TA001302": 6, "TA001303": 7, "TA001304": 8, "TA001305": 9, "TA001306": 10, "TA001307": 11, "TA001308": 12, "TA001309": 13, "TA000473": 14, "TA000524": 15, "TA000475": 16, "TA004628": 17, "TA000275": 18, "TA000639": 19, "TA002503": 20, "TA002965": 21, "TA002964": 22, "TA002504": 23, "TA003941": 24, "TA004252": 25, "TA004161": 26, "TA003942": 27, "TA003943": 28, "TA003944": 29, "TA004225": 30, "TA004226": 31, "TA002942": 32, "TA003113": 33, "TA002572": 34, "N:": 35, "TA003080": 36, "TA003192": 37, "TA001558": 38, "PF004933": 39, "PF005602": 40, "PF005613": 41, "PF004750": 42, "PF006118": 43, "PF005864": 44, "PF005499": 45, "TA002440": 46, "TA002439": 47, "VARIOS": 48, "PF010122": 49, "TA004108": 50, "N:NEGRO": 51, "TA000712": 52, "TA001329": 53, "TA001330": 54, "TA001331": 55, "TA001332": 56, "TA001333": 57, "TA001313": 58, "TA001311": 59, "TA001312": 60, "TA001310": 61, "TA001315": 62, "TA001314": 63, "PF000100": 64, "TA000430": 65, "TA000415": 66, "TA000434": 67, "TA000420": 68, "TA000433": 69, "TA000432": 70, "TA000439": 71, "TA000428": 72, "TA000429": 73, "TA000153": 74, "TA000416": 75, "TA000649": 76, "TA000427": 77, "TA000651": 78, "TA000431": 79, "TA000137": 80, "TA000421": 81, "TA000648": 82, "TA000647": 83, "TA000422": 84, "TA000650": 85, "TA001280": 86, "TA000495": 87, "TA000441": 88, "TA000418": 89, "TA000453": 90, "TA000384": 91, "TA000128": 92, "TA000383": 93, "TA000542": 94, "TA000543": 95, "TA000541": 96, "TA002299": 97, "TA002300": 98, "TA002301": 99, "TA000594": 100, "PF000148": 101, "PF000154": 102, "PF000151": 103, "PF000140": 104, "PF000143": 105, "PF000142": 106, "PF000150": 107, "PF000141": 108, "PF000147": 109, "PF000146": 110, "PF001409": 111, "PF002313": 112, "PF000152": 113, "PF001407": 114, "PF000149": 115, "PF000144": 116, "PF000145": 117, "PF000138": 118, "PF000133": 119, "PF000132": 120, "PF002623": 121, "PF000135": 122, "PF000136": 123, "PF000134": 124, "PF000139": 125, "PF001393": 126, "PF008695": 127, "PF000126": 128, "PF000111": 129, "PF000113": 130, "PF001619": 131, "PF000116": 132, "PF000117": 133, "PF000115": 134, "PF000109": 135, "PF000122": 136, "PF002710": 137, "PF000103": 138, "PF000123": 139, "PF000112": 140, "PF000101": 141, "PF000106": 142, "PF000107": 143, "PF000118": 144, "PF000108": 145, "PF000415": 146, "PF001553": 147, "PF000114": 148, "PF000121": 149, "PF0000415": 150, "PF007245": 151, "PF001385": 152, "PF001381": 153, "PF001386": 154, "PF005333": 155, "PF001814": 156, "PF005104": 157, "PF003168": 158, "PF007114": 159, "PF002205": 160, "PF007861": 161, "PF008819": 162, "PF007860": 163, "PF008460": 164, "PF002800": 165, "PF001391": 166, "PF001388": 167, "PF002798": 168, "TA000103": 169, "PF009021": 170, "PF002396": 171, "PF001387": 172, "PF002390": 173, "PF002386": 174, "PF009541": 175, "PF004220": 176, "PF009542": 177}, "Envases y embalaje": {"EMBALAJE": 0}, "Materias primas auxiliares": {"MATERIAPRIMAAUX.": 0}, "Stock de productos terminados": {"N:BANDELETAS STOCK SEGURIDAD": 0, "N:ROJO TIEMPO": 1, "N:VERDE ANIMALES": 2, "N:AZUL FRUTA": 3, "N:AMARILLO VEHICULOS": 4, "N:NARANJA DEPORTE": 5, "N:VIOLETA TIERRA": 6, "N:MARMOL AMARILLO": 7, "N:MARMOL ROJO": 8, "N:MARMOL FUXIA": 9, "N:MARMOL VIOLETA": 10, "N:MARMOL AZUL8": 11, "N:CAMUFLAJE CONFUSIUS": 12, "N:CAMUFLAJE NEWTON": 13, "N:CAMUFLAJE RUBENS": 14, "N:MARMOL VERDE": 15, "N:CAMUFLAJE WATT": 16, "N:CAMUFLAJE DA VINCI": 17, "N:CAMUFLAJE MARCO POLO": 18, "N:SIN SERIGRAFIA AZUL": 19, "N:SIN SERIGRAFIA ROJO": 20, "N:SIN SERIGRAFIA VIOLETA": 21, "N:SIN SERIGRAFIA AMARILLO": 22, "N:SIN SERIGRAFIA VERDE": 23, "N:SIN SERIGRAFIA NARANJA3": 24, "N:PACK CUBOS 4 COLORES": 25, "TA003942": 26, "TA003943": 27, "TA003941": 28, "TA004252": 29, "TA001558": 30, "N:NEGRO 120X60 HEXAGONO VENTOSA 10MM": 31, "PF00719": 32, "N:GRIS 7MM 140X60 S M": 33, "N:AZUL 7MM 140X60 S M": 34, "N:NEGRO 15MM 140X60 S M": 35, "N:GRIS 15MM 140X60 S M": 36, "N:NEGRO 10 MM 100X60 HEX VENTOSA": 37, "N:HIELO 10 MM 100X60 HEX VENTOSA": 38, "N:CAMEL 10MM 120X50 HEXAGONO VENTOSA": 39, "N:GRIS 15MM 140X60 S M DEFECTUASAS": 40, "N:NEGRO 10MM 160X60 YOGA": 41, "N:YOGA ONE KAKI": 42, "PF001037": 43, "PF004645": 44, "PF000996": 45, "PF000999": 46, "N:PALA EVA HERCULES TALLA 39 PAR AZUL": 47, "N:PALA EVA HERCULES TALLA 40 PAR AZUL": 48, "N:PALA EVA HERCULES TALLA 41 PAR AZUL": 49, "N:PALA EVA HERCULES TALLA 42 PAR AZUL": 50, "N:PALA EVA HERCULES TALLA 43 PAR AZUL": 51, "N:PALA EVA HERCULES TALLA 44 PAR NEGRO": 52, "N:PALA EVA HERCULES TALLA 45 PAR NEGRO": 53, "N:PALA EVA HERCULES TALLA 47 PAR NEGRO": 54, "N:PALA EVA HERCULES TALLA 39 PAR NEGRO": 55, "N:PALA EVA HERCULES TALLA 41 PAR NEGRO": 56, "N:ALMOHADILLLA TRABAJO PLEGABLE 50X120 CM LASER WHALEN 20MM NEG ROJ NEG": 57}};
const ORDEN_FAMILIAS=["Stock de planchas","Envases y embalaje","Materias primas auxiliares","Stock de productos terminados"];

function claveOrdenProducto(p){
    const c=claveCodigo(p.codigo||p.referencia||p.ref||"");
    return c || "N:"+claveNombre(p.nombre||p.descripcion||"");
}
function posicionAgosto(p){
    // La importación original conserva excelFila: es la posición real del Excel de agosto.
    const fila=Number(p.excelFila);
    const origen=String(p.origenExcel||p.origen||p.importacion||"").toUpperCase();
    if(Number.isFinite(fila) && fila>0 && origen.includes("AGOSTO")) return fila;
    const f=familiaDe(p)||"";
    const mapa=ORDEN_AGOSTO[f]||{};
    const k=claveOrdenProducto(p);
    return Object.prototype.hasOwnProperty.call(mapa,k) ? mapa[k] : Number.MAX_SAFE_INTEGER;
}
function compararOrdenInventario(a,b){
    const fa=familiaDe(a)||"", fb=familiaDe(b)||"";
    const ia=ORDEN_FAMILIAS.indexOf(fa), ib=ORDEN_FAMILIAS.indexOf(fb);
    if(ia!==ib) return (ia<0?999:ia)-(ib<0?999:ib);
    const pa=posicionAgosto(a), pb=posicionAgosto(b);
    if(pa!==pb) return pa-pb;
    // Los productos nuevos quedan al final de su familia, sin mezclarse con agosto.
    return String(a.nombre||"").localeCompare(String(b.nombre||""),"es",{numeric:true,sensitivity:"base"});
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

    const documentosOrdenados = datos.docs
        .map(documento=>({documento,p:{id:documento.id,...documento.data()}}))
        .sort((a,b)=>compararOrdenInventario(a.p,b.p));

    documentosOrdenados.forEach(({documento,p}) => {

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
    const borrar=document.getElementById("eliminarSeleccionados");
    out.innerHTML="Buscando duplicados en todas las categorías...";
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
document.getElementById("analizarDuplicados")?.addEventListener("click",analizarDuplicadosManual);
document.getElementById("eliminarSeleccionados")?.addEventListener("click",eliminarDuplicadosSeleccionados);
