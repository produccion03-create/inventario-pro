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

        // Impedir crear una referencia que ya exista en cualquier categoría.
        const existentes = await getDocs(collection(db, "productos"));
        const claveNueva = claveCodigo(codigo);
        const yaExiste = existentes.docs.some(d => {
            const p=d.data();
            return claveCodigo(p.codigo || p.referencia || p.ref || "") === claveNueva;
        });
        if (yaExiste) {
            alert("⚠️ Ya existe un producto con la referencia " + codigo + ". No se ha creado un duplicado.");
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
// DUPLICADOS - TODAS LAS CATEGORÍAS
// ==========================

function claveCodigo(v){
    return String(v ?? "").trim().toUpperCase().replace(/\s+/g,"");
}

function puntuacionRegistro(p){
    let n=0;
    // Preferimos datos completos y familia canónica.
    if(FAMILIAS.includes(familiaDe(p))) n+=20;
    if(p.nombre) n+=5;
    if(p.codigo) n+=5;
    if(p.familia) n+=3;
    if(p.categoria) n+=2;
    if(p.proveedor || p.ubicacion) n+=2;
    if(p.formato) n+=2;
    if(p.precio !== undefined && p.precio !== null && p.precio !== "") n+=3;
    if(p.stock !== undefined && p.stock !== null && p.stock !== "") n+=3;
    // Los productos creados desde la aplicación no dependen de la importación antigua.
    if(!p.origenExcel && !p.importacion) n+=4;
    return n;
}

let duplicadosDetectados=[];

async function analizarDuplicados(){
    const salida=document.getElementById("resultadoDuplicados");
    const boton=document.getElementById("eliminarDuplicados");
    salida.innerHTML="Analizando todas las categorías...";
    boton.disabled=true;
    duplicadosDetectados=[];

    try{
        const snap=await getDocs(collection(db,"productos"));
        const grupos=new Map();

        snap.forEach(d=>{
            const p={id:d.id,...d.data()};
            const clave=claveCodigo(p.codigo || p.referencia || p.ref || "");
            if(!clave) return; // Nunca borramos registros sin referencia.
            if(!grupos.has(clave)) grupos.set(clave,[]);
            grupos.get(clave).push(p);
        });

        for(const [codigo,items] of grupos){
            if(items.length<2) continue;

            const ordenados=[...items].sort((a,b)=>{
                const dif=puntuacionRegistro(b)-puntuacionRegistro(a);
                if(dif) return dif;
                // En empate, preferimos el registro que ya usa campos canónicos.
                const bc=(FAMILIAS.includes(String(b.familia||"").trim())?1:0);
                const ac=(FAMILIAS.includes(String(a.familia||"").trim())?1:0);
                return bc-ac;
            });

            duplicadosDetectados.push({
                codigo,
                conservar:ordenados[0],
                eliminar:ordenados.slice(1)
            });
        }

        duplicadosDetectados.sort((a,b)=>a.codigo.localeCompare(b.codigo,"es"));
        const copias=duplicadosDetectados.reduce((s,g)=>s+g.eliminar.length,0);

        if(!duplicadosDetectados.length){
            salida.innerHTML=`<strong>✅ ${snap.size} productos revisados. No hay referencias duplicadas en ninguna categoría.</strong>`;
            return;
        }

        const filas=duplicadosDetectados.map(g=>{
            const k=g.conservar;
            const borrados=g.eliminar.map(p =>
                `${p.nombre||"(sin nombre)"} · ${familiaDe(p)||p.categoria||"Sin categoría"} · Stock ${Number(p.stock)||0}`
            ).join("<br>");
            return `<tr>
                <td><strong>${g.codigo}</strong></td>
                <td>${k.nombre||"(sin nombre)"}<br><small>${familiaDe(k)||k.categoria||"Sin categoría"} · Stock ${Number(k.stock)||0}</small></td>
                <td>${borrados}</td>
            </tr>`;
        }).join("");

        salida.innerHTML=`
          <div style="margin-bottom:12px">
            <strong>Productos revisados:</strong> ${snap.size}<br>
            <strong>Referencias duplicadas:</strong> ${duplicadosDetectados.length}<br>
            <strong>Copias que se eliminarán:</strong> ${copias}
          </div>
          <div style="overflow-x:auto">
            <table class="tabla-productos">
              <thead><tr><th>Referencia</th><th>Se conserva</th><th>Copias a eliminar</th></tr></thead>
              <tbody>${filas}</tbody>
            </table>
          </div>`;
        boton.disabled=false;
    }catch(error){
        console.error(error);
        salida.innerHTML="❌ Error al analizar duplicados.";
    }
}

async function eliminarDuplicadosSeguros(){
    if(!duplicadosDetectados.length) return;
    const total=duplicadosDetectados.reduce((s,g)=>s+g.eliminar.length,0);
    if(!confirm(`Se eliminarán ${total} copias duplicadas. Se conservará un producto por referencia. ¿Continuar?`)) return;

    const boton=document.getElementById("eliminarDuplicados");
    boton.disabled=true;

    try{
        const tareas=[];
        duplicadosDetectados.forEach(g=>{
            g.eliminar.forEach(p=>{
                tareas.push(deleteDoc(doc(db,"productos",p.id)));
            });
        });
        await Promise.all(tareas);
        alert(`✅ Limpieza terminada. Se han eliminado ${total} copias duplicadas.`);
        duplicadosDetectados=[];
        await normalizarProductosGuardados();
        await mostrarProductos();
        await analizarDuplicados();
    }catch(error){
        console.error(error);
        alert("❌ No se pudo completar la limpieza.");
        boton.disabled=false;
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
document.getElementById("analizarDuplicados")
    ?.addEventListener("click", analizarDuplicados);
document.getElementById("eliminarDuplicados")
    ?.addEventListener("click", eliminarDuplicadosSeguros);
