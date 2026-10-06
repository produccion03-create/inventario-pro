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
        const actuales=await getDocs(collection(db,"productos"));
        const claveNueva=claveCodigo(codigo);
        if(claveNueva && actuales.docs.some(d=>claveCodigo(d.data().codigo||d.data().referencia||d.data().ref||"")===claveNueva)){
            alert("⚠️ Esa referencia ya existe. No se ha creado otra copia.");
            return;
        }

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
// LIMPIEZA CONTRA INVENTARIO DE AGOSTO
// ==========================
const CODIGOS_AGOSTO=new Set(["PF0000415", "PF000100", "PF000101", "PF000103", "PF000106", "PF000107", "PF000108", "PF000109", "PF000111", "PF000112", "PF000113", "PF000114", "PF000115", "PF000116", "PF000117", "PF000118", "PF000121", "PF000122", "PF000123", "PF000126", "PF000132", "PF000133", "PF000134", "PF000135", "PF000136", "PF000138", "PF000139", "PF000140", "PF000141", "PF000142", "PF000143", "PF000144", "PF000145", "PF000146", "PF000147", "PF000148", "PF000149", "PF000150", "PF000151", "PF000152", "PF000154", "PF000415", "PF000996", "PF000999", "PF001037", "PF001381", "PF001385", "PF001386", "PF001387", "PF001388", "PF001391", "PF001393", "PF001407", "PF001409", "PF001553", "PF001619", "PF001814", "PF002205", "PF002313", "PF002386", "PF002390", "PF002396", "PF002623", "PF002710", "PF002798", "PF002800", "PF003168", "PF004220", "PF004645", "PF004750", "PF004933", "PF005104", "PF005333", "PF005499", "PF005602", "PF005613", "PF005864", "PF006118", "PF007114", "PF00719", "PF007245", "PF007860", "PF007861", "PF008460", "PF008695", "PF008819", "PF009021", "PF009541", "PF009542", "PF010122", "TA000103", "TA000128", "TA000137", "TA000153", "TA000275", "TA000383", "TA000384", "TA000415", "TA000416", "TA000418", "TA000420", "TA000421", "TA000422", "TA000427", "TA000428", "TA000429", "TA000430", "TA000431", "TA000432", "TA000433", "TA000434", "TA000439", "TA000441", "TA000453", "TA000473", "TA000475", "TA000495", "TA000524", "TA000539", "TA000541", "TA000542", "TA000543", "TA000594", "TA000639", "TA000647", "TA000648", "TA000649", "TA000650", "TA000651", "TA000712", "TA000728", "TA001280", "TA001300", "TA001301", "TA001302", "TA001303", "TA001304", "TA001305", "TA001306", "TA001307", "TA001308", "TA001309", "TA001310", "TA001311", "TA001312", "TA001313", "TA001314", "TA001315", "TA001329", "TA001330", "TA001331", "TA001332", "TA001333", "TA001558", "TA002299", "TA002300", "TA002301", "TA002439", "TA002440", "TA002503", "TA002504", "TA002572", "TA002942", "TA002964", "TA002965", "TA003080", "TA003113", "TA003166", "TA003192", "TA003941", "TA003942", "TA003943", "TA003944", "TA004108", "TA004161", "TA004225", "TA004226", "TA004252", "TA004628"]);
const NOMBRES_AGOSTO=new Set(["100038 OPEN SKIFF 20 DEL PEDIDO PVN2503545", "107030 TAHE KAYAK PAD 2 OUQASSOU + NITTO DEL PVN2503544", "107262 TAHE KAYAK PAD 6 BORNEO + NITTO DEL PVN2503542", "109691 SIC SURF-2024 PHANTOM 8'4 CARDADO + NITTO", "109691 SIC SURF-2024 PHANTOM 8'4 CARDADO + NITTO DEL PEDIDO PVN2503542", "ALMENDRAS", "ALMOHADILLLA TRABAJO PLEGABLE 50X120 CM LASER WHALEN 20MM NEG/ROJ/NEG", "AMARILLO VEHÍCULOS", "AMARILLO(7)", "ANILLAS OLLADOS", "AZUL (8)", "AZUL 100X60 15MM 2 LOGOS TA003942", "AZUL 140X60 7MM TA003942", "AZUL 160X60 S/M 15MM TA004252", "AZUL 7MM 140X60 S/M", "AZUL CLARO 65", "AZUL FRUTA", "BANDELETAS", "BANDELETAS STOCK SEGURIDAD", "BOLITAS", "BOLSAS", "CAJAS", "CAMEL 10MM 120X50 HEXAGONO + VENTOSA", "CAMUFLAJE CONFUSIUS", "CAMUFLAJE DA VINCI", "CAMUFLAJE MARCO POLO", "CAMUFLAJE NEWTON", "CAMUFLAJE RUBENS", "CAMUFLAJE WATT", "COLAS", "COLCHONETA 2 LOGOS", "COLCHONETA 4 LOGOS", "COLCHONETA ACABADA", "CONFORGYM 140X60 15MM NEGRO S/M SIN MEDALLÓN PF00719", "CUERDAS", "DOBLE CARA", "EVA BLANCO", "EVA BLANCO 13", "FILM", "GRIS 100X60 15MM 2 LOGOS TA003943", "GRIS 140X60 15MM 2 LOGOS TA003943", "GRIS 15MM 140X60 S/M", "GRIS 15MM 140X60 S/M DEFECTUASAS", "GRIS 34", "GRIS 7MM 140X60 S/M", "HIELO 10 MM 100X60 HEX+VENTOSA", "IMAN", "MUESTRARIO TORNILLOS METÁLICOS", "MÁRMOL AMARILLO", "MÁRMOL AZUL8", "MÁRMOL FUXIA", "MÁRMOL ROJO", "MÁRMOL VERDE", "MÁRMOL VIOLETA", "NARANJA 4", "NARANJA DEPORTE", "NARANJA(285)", "NARANJA(3)", "NARANJA(4)", "NEGRO", "NEGRO 10 MM 100X60 HEX+VENTOSA", "NEGRO 100X60 7MM 2 LOGOS TA003941", "NEGRO 100X60 7MM 4 LOGOS TA003941", "NEGRO 10MM 160X60 YOGA", "NEGRO 120X60 HEXAGONO + VENTOSA 10MM", "NEGRO 140X60 7MM 4 LOGOS TA003941", "NEGRO 15MM 140X60 S/M", "OTROS CUBOS ACABADOS:", "OTROS CUBOS SIN SERIGRAFÍA:", "PACK CUBOS 4 COLORES", "PALA EVA HERCULES TALLA 39 PAR AZUL", "PALA EVA HERCULES TALLA 39 PAR NEGRO", "PALA EVA HERCULES TALLA 40 PAR AZUL", "PALA EVA HERCULES TALLA 41 PAR AZUL", "PALA EVA HERCULES TALLA 41 PAR NEGRO", "PALA EVA HERCULES TALLA 42 PAR AZUL", "PALA EVA HERCULES TALLA 43 PAR AZUL", "PALA EVA HERCULES TALLA 44 PAR NEGRO", "PALA EVA HERCULES TALLA 45 PAR NEGRO", "PALA EVA HERCULES TALLA 47 PAR NEGRO", "PALETIZAR", "PALETS", "PANEL SUELO", "PAPEL", "PEDIDO SHA", "PF000996", "PF000999", "PF001037", "PF004645", "PISTACHO(71)", "PRECINTO CINTAS", "PROLONGADORES METÁLICOS", "PVC", "RETRACTIL", "RIDE AWAKE", "ROJO TIEMPO", "ROJO(22)", "ROJO(85)", "ROSA (16)", "SERIGRAFIA", "SIN MEDALLON", "SIN SERIGRAFÍA AMARILLO", "SIN SERIGRAFÍA AZUL", "SIN SERIGRAFÍA NARANJA3", "SIN SERIGRAFÍA ROJO", "SIN SERIGRAFÍA VERDE", "SIN SERIGRAFÍA VIOLETA", "TIGUAR 120X60 15MM TURQUESA TA001558", "TIRAS CHANCLAS", "TORNILLOS PLASTICOS", "TURQUESA(48)", "VARIOS", "VERDE ANIMALES", "VERDE JADE (57)", "VERDE(6)", "VIOLETA TIERRA", "VIOLETA(10)", "VIOLETA(117)", "YOGA ONE KAKI"]);

function claveCodigo(v){
    return String(v??"").trim().toUpperCase().replace(/\s+/g,"");
}
function claveNombre(v){
    return String(v??"").trim().toUpperCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^A-Z0-9]+/g," ").trim().replace(/\s+/g," ");
}
const NOMBRES_AGOSTO_NORM=new Set([...NOMBRES_AGOSTO].map(claveNombre));

function esRegistroAgosto(p){
    const origen=String(p.origenExcel||p.origen||p.importacion||"").toUpperCase();
    if(origen.includes("AGOSTO")) return true;
    const c=claveCodigo(p.codigo||p.referencia||p.ref||"");
    const n=claveNombre(p.nombre||p.descripcion||"");
    return CODIGOS_AGOSTO.has(c) || NOMBRES_AGOSTO_NORM.has(n);
}
function puntuacion(p){
    let s=0;
    if(!esRegistroAgosto(p)) s+=100; // prioridad absoluta a lo añadido después
    if(FAMILIAS.includes(familiaDe(p))) s+=20;
    if(p.codigo) s+=5; if(p.nombre) s+=5;
    if(p.stock!==undefined && p.stock!==null && p.stock!=="") s+=3;
    if(p.precio!==undefined && p.precio!==null && p.precio!=="") s+=3;
    if(p.proveedor||p.ubicacion) s+=2;
    if(p.formato) s+=2;
    return s;
}

let gruposParaBorrar=[];

async function analizarDuplicados(){
    const out=document.getElementById("resultadoDuplicados");
    const btn=document.getElementById("eliminarDuplicados");
    out.innerHTML="Revisando todas las categorías...";
    btn.disabled=true;
    gruposParaBorrar=[];

    const snap=await getDocs(collection(db,"productos"));
    const docs=snap.docs.map(d=>({id:d.id,...d.data()}));

    // Primero agrupar por referencia exacta. Si no hay referencia, por nombre exacto normalizado.
    const grupos=new Map();
    docs.forEach(p=>{
        const c=claveCodigo(p.codigo||p.referencia||p.ref||"");
        const n=claveNombre(p.nombre||p.descripcion||"");
        const k=c ? "C:"+c : (n ? "N:"+n : "");
        if(!k) return;
        if(!grupos.has(k)) grupos.set(k,[]);
        grupos.get(k).push(p);
    });

    for(const [k,items] of grupos){
        if(items.length<2) continue;
        const orden=[...items].sort((a,b)=>puntuacion(b)-puntuacion(a));
        gruposParaBorrar.push({clave:k,conservar:orden[0],eliminar:orden.slice(1)});
    }

    const copias=gruposParaBorrar.reduce((s,g)=>s+g.eliminar.length,0);
    const nuevos=docs.filter(p=>!esRegistroAgosto(p)).length;

    if(!copias){
        out.innerHTML=`<strong>✅ ${docs.length} productos revisados.</strong><br>No quedan duplicados exactos por referencia/nombre.<br><strong>Productos añadidos fuera de agosto protegidos:</strong> ${nuevos}`;
        return;
    }

    out.innerHTML=`
      <strong>Total actual:</strong> ${docs.length}<br>
      <strong>Productos nuevos protegidos:</strong> ${nuevos}<br>
      <strong>Grupos repetidos:</strong> ${gruposParaBorrar.length}<br>
      <strong>Copias que se eliminarán:</strong> ${copias}<br><br>
      <div style="overflow-x:auto"><table class="tabla-productos">
      <thead><tr><th>Referencia / nombre</th><th>Se conserva</th><th>Se elimina</th></tr></thead>
      <tbody>${gruposParaBorrar.map(g=>`<tr>
        <td><b>${g.clave.substring(2)}</b></td>
        <td>${g.conservar.nombre||""} · ${familiaDe(g.conservar)||""}${!esRegistroAgosto(g.conservar)?" · 🆕 protegido":""}</td>
        <td>${g.eliminar.map(p=>(p.nombre||"")+" · "+(familiaDe(p)||"")).join("<br>")}</td>
      </tr>`).join("")}</tbody></table></div>`;
    btn.disabled=false;
}

async function eliminarDuplicadosSeguros(){
    if(!gruposParaBorrar.length) return;
    const total=gruposParaBorrar.reduce((s,g)=>s+g.eliminar.length,0);
    if(!confirm(`Se eliminarán ${total} copias repetidas. Los productos nuevos únicos no se tocan. ¿Continuar?`)) return;
    const tareas=[];
    gruposParaBorrar.forEach(g=>g.eliminar.forEach(p=>tareas.push(deleteDoc(doc(db,"productos",p.id)))));
    await Promise.all(tareas);
    alert(`✅ Eliminadas ${total} copias duplicadas.`);
    await normalizarProductosGuardados();
    await mostrarProductos();
    await analizarDuplicados();
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
document.getElementById("analizarDuplicados")?.addEventListener("click",analizarDuplicados);
document.getElementById("eliminarDuplicados")?.addEventListener("click",eliminarDuplicadosSeguros);
