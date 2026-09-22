import {
    db,
    collection,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp
} from "./firebase.js";

const entradaOrigen = document.getElementById("entradaOrigen");
const disponibleEntrada = document.getElementById("disponibleEntrada");
const cantidad = document.getElementById("cantidad");
const observaciones = document.getElementById("observaciones");
const boton = document.getElementById("guardarSalida");
const tabla = document.getElementById("tablaEntradasSalida");

let productos = [];
let movimientos = [];
let entradas = [];
let entradaSeleccionada = null;

const norm = v => String(v || "").trim().toUpperCase();

function claveEntrada(m){
    // Each actual receipt is kept separately by its movement id.
    return m.id;
}

function salidasDeEntrada(entradaId){
    return movimientos
        .filter(m => m.tipo === "Salida" && m.entradaOrigenId === entradaId)
        .reduce((s,m) => s + Number(m.cantidad || 0), 0);
}

function disponibleDeEntrada(e){
    return Math.max(Number(e.cantidad || 0) - salidasDeEntrada(e.id), 0);
}

function actualizarSelector(){
    entradas = movimientos
        .filter(m => m.tipo === "Entrada" && (m.pcn || m.pvn))
        .sort((a,b)=>(b.fecha?.seconds || 0) - (a.fecha?.seconds || 0));

    entradaOrigen.innerHTML = '<option value="">Selecciona una entrada</option>';

    entradas.forEach(e => {
        const disponible = disponibleDeEntrada(e);
        const opt = document.createElement("option");
        opt.value = e.id;
        opt.textContent =
            `${e.pcn || ""} | ${e.pvn || ""} | ${e.producto || ""} | Entraron ${Number(e.cantidad || 0)} | Disponibles ${disponible}`;
        if(disponible <= 0) opt.disabled = true;
        entradaOrigen.appendChild(opt);
    });

    actualizarEntrada();
    pintarTabla();
}

function actualizarEntrada(){
    entradaSeleccionada = entradas.find(e => e.id === entradaOrigen.value) || null;
    disponibleEntrada.textContent = entradaSeleccionada ? disponibleDeEntrada(entradaSeleccionada) : 0;
}

function pintarTabla(){
    if(!entradas.length){
        tabla.innerHTML = '<tr><td colspan="7" style="padding:14px">No hay entradas PCN/PVN registradas.</td></tr>';
        return;
    }

    tabla.innerHTML = entradas.map(e => {
        const recibido = Number(e.cantidad || 0);
        const salidas = salidasDeEntrada(e.id);
        const disponible = Math.max(recibido - salidas, 0);
        const estado = disponible <= 0 ? "Agotada" : (salidas > 0 ? "Parcial" : "Disponible");

        return `<tr>
          <td style="padding:9px;border-bottom:1px solid #eee"><strong>${e.pcn || ""}</strong></td>
          <td style="padding:9px;border-bottom:1px solid #eee"><strong>${e.pvn || ""}</strong></td>
          <td style="padding:9px;border-bottom:1px solid #eee">${e.producto || ""}</td>
          <td style="padding:9px;border-bottom:1px solid #eee;text-align:right">${recibido}</td>
          <td style="padding:9px;border-bottom:1px solid #eee;text-align:right">${salidas}</td>
          <td style="padding:9px;border-bottom:1px solid #eee;text-align:right"><strong>${disponible}</strong></td>
          <td style="padding:9px;border-bottom:1px solid #eee">${estado}</td>
        </tr>`;
    }).join("");
}

async function cargar(){
    const [ps,ms] = await Promise.all([
        getDocs(collection(db,"productos")),
        getDocs(collection(db,"movimientos"))
    ]);

    productos = ps.docs.map(d => ({id:d.id,...d.data()}));
    movimientos = ms.docs.map(d => ({id:d.id,...d.data()}));

    actualizarSelector();
}

entradaOrigen.addEventListener("change", actualizarEntrada);

boton.addEventListener("click", async () => {
    if(!entradaSeleccionada){
        alert("Selecciona la entrada de la que quieres sacar material");
        return;
    }

    const cantidadSalida = Number(cantidad.value);
    const disponible = disponibleDeEntrada(entradaSeleccionada);

    if(!(cantidadSalida > 0)){
        alert("Introduce una cantidad válida");
        return;
    }

    if(cantidadSalida > disponible){
        alert(`Solo quedan ${disponible} unidades disponibles de esta entrada`);
        return;
    }

    const producto = productos.find(p =>
        p.id === entradaSeleccionada.productoId ||
        (entradaSeleccionada.codigo && p.codigo === entradaSeleccionada.codigo)
    );

    if(!producto){
        alert("No se encuentra el producto de esta entrada en el inventario");
        return;
    }

    const stockAnterior = Number(producto.stock || 0);

    if(cantidadSalida > stockAnterior){
        alert(`El stock general del producto es ${stockAnterior}. No se puede sacar más.`);
        return;
    }

    const stockFinal = stockAnterior - cantidadSalida;
    const disponibleFinal = disponible - cantidadSalida;

    if(!confirm(
        `${entradaSeleccionada.pcn || ""} ↔ ${entradaSeleccionada.pvn || ""}\n` +
        `${entradaSeleccionada.producto || ""}\n` +
        `Sacar: ${cantidadSalida}\n` +
        `Quedarán de esta entrada: ${disponibleFinal}\n\n¿Continuar?`
    )) return;

    await updateDoc(doc(db,"productos",producto.id),{
        stock: stockFinal
    });

    await addDoc(collection(db,"movimientos"),{
        tipo:"Salida",
        entradaOrigenId:entradaSeleccionada.id,
        pcn:norm(entradaSeleccionada.pcn),
        pvn:norm(entradaSeleccionada.pvn),
        productoId:producto.id,
        codigo:producto.codigo || entradaSeleccionada.codigo || "",
        producto:producto.nombre || entradaSeleccionada.producto || "",
        categoria:producto.categoria || producto.familia || "",
        cantidad:cantidadSalida,
        stockAnterior,
        stockFinal,
        disponibleEntradaAnterior:disponible,
        disponibleEntradaFinal:disponibleFinal,
        observaciones:observaciones.value.trim(),
        fecha:serverTimestamp()
    });

    alert(`✅ Salida registrada\nQuedan ${disponibleFinal} unidades de esa entrada.`);
    location.reload();
});

cargar().catch(error=>{
    console.error(error);
    alert("Error al cargar las entradas");
});
