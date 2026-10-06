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