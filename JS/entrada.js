import {
    db,
    collection,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp
} from "./firebase.js";

const selectorProducto = document.getElementById("producto");
const stockActual = document.getElementById("stockActual");
const stockActual2 = document.getElementById("stockActual2");
const cantidad = document.getElementById("cantidad");
const cantidadVista = document.getElementById("cantidadVista");
const observaciones = document.getElementById("observaciones");
const boton = document.getElementById("guardarEntrada");

const pcn = document.getElementById("pcn");
const pvn = document.getElementById("pvn");
const cantidadPedida = document.getElementById("cantidadPedida");
const recibidoAnterior = document.getElementById("recibidoAnterior");
const pedidoVista = document.getElementById("pedidoVista");
const recibidoTotalVista = document.getElementById("recibidoTotalVista");
const pendienteVista = document.getElementById("pendienteVista");
const estadoPedido = document.getElementById("estadoPedido");

let productos = [];
let productoSeleccionado = null;
let movimientos = [];

const normalizar = v => String(v || "").trim().toUpperCase();

async function cargarDatos(){
    const [datosProductos, datosMovimientos] = await Promise.all([
        getDocs(collection(db,"productos")),
        getDocs(collection(db,"movimientos"))
    ]);

    productos = [];
    selectorProducto.innerHTML = "";

    datosProductos.forEach(documento => {
        productos.push({ id: documento.id, ...documento.data() });
    });

    movimientos = [];
    datosMovimientos.forEach(documento => {
        movimientos.push({ id: documento.id, ...documento.data() });
    });

    productos.sort((a,b) => String(a.nombre || "").localeCompare(String(b.nombre || "")));

    productos.forEach(p => {
        const opcion = document.createElement("option");
        opcion.value = p.id;
        opcion.textContent = `${p.nombre} · Stock ${p.stock}`;
        selectorProducto.appendChild(opcion);
    });

    actualizarStock();
    actualizarPedido();
}

function actualizarStock(){
    productoSeleccionado = productos.find(p => p.id === selectorProducto.value);
    if(!productoSeleccionado) return;

    stockActual.textContent = productoSeleccionado.stock;
    stockActual2.textContent = productoSeleccionado.stock;
    actualizarPedido();
}

function recepcionesPrevias(){
    if(!productoSeleccionado) return 0;

    const clavePCN = normalizar(pcn.value);
    const clavePVN = normalizar(pvn.value);
    if(!clavePCN && !clavePVN) return 0;

    return movimientos
        .filter(m =>
            m.tipo === "Entrada" &&
            m.productoId === productoSeleccionado.id &&
            (!clavePCN || normalizar(m.pcn) === clavePCN) &&
            (!clavePVN || normalizar(m.pvn) === clavePVN)
        )
        .reduce((s,m) => s + Number(m.cantidad || 0), 0);
}

function actualizarPedido(){
    const pedida = Number(cantidadPedida.value || 0);
    const anterior = recepcionesPrevias();
    const entradaAhora = Number(cantidad.value || 0);
    const total = anterior + entradaAhora;
    const pendiente = pedida - total;

    recibidoAnterior.textContent = anterior;
    pedidoVista.textContent = pedida;
    recibidoTotalVista.textContent = total;
    pendienteVista.textContent = pendiente;

    if(pedida <= 0){
        estadoPedido.textContent = "Introduce la cantidad pedida";
    } else if(total === 0){
        estadoPedido.textContent = "Pendiente";
    } else if(total < pedida){
        estadoPedido.textContent = "Parcial";
    } else if(total === pedida){
        estadoPedido.textContent = "Completo";
    } else {
        estadoPedido.textContent = `Exceso: ${total - pedida}`;
    }
}

selectorProducto.addEventListener("change", actualizarStock);
cantidad.addEventListener("input", () => {
    cantidadVista.textContent = cantidad.value || 0;
    actualizarPedido();
});
pcn.addEventListener("input", actualizarPedido);
pvn.addEventListener("input", actualizarPedido);
cantidadPedida.addEventListener("input", actualizarPedido);

boton.addEventListener("click", async () => {
    const cantidadAñadir = Number(cantidad.value);
    const pedida = Number(cantidadPedida.value);
    const codigoPCN = normalizar(pcn.value);
    const codigoPVN = normalizar(pvn.value);

    if(!productoSeleccionado){
        alert("Selecciona un producto");
        return;
    }
    if(!codigoPCN){
        alert("Introduce el PCN");
        return;
    }
    if(!codigoPVN){
        alert("Introduce el PVN relacionado");
        return;
    }
    if(pedida <= 0){
        alert("Introduce la cantidad pedida");
        return;
    }
    if(cantidadAñadir <= 0){
        alert("Introduce una cantidad recibida válida");
        return;
    }

    const anterior = recepcionesPrevias();
    const recibidoAcumulado = anterior + cantidadAñadir;
    const diferencia = recibidoAcumulado - pedida;
    const pendiente = Math.max(pedida - recibidoAcumulado, 0);
    const estado = recibidoAcumulado < pedida ? "Parcial" :
                   recibidoAcumulado === pedida ? "Completo" : "Exceso";

    const nuevoStock = Number(productoSeleccionado.stock) + cantidadAñadir;

    await updateDoc(
        doc(db,"productos",productoSeleccionado.id),
        { stock: nuevoStock }
    );

    await addDoc(collection(db,"movimientos"), {
        tipo: "Entrada",
        productoId: productoSeleccionado.id,
        codigo: productoSeleccionado.codigo,
        producto: productoSeleccionado.nombre,
        categoria: productoSeleccionado.categoria || productoSeleccionado.familia || "",
        cantidad: cantidadAñadir,
        stockAnterior: Number(productoSeleccionado.stock),
        stockFinal: nuevoStock,

        pcn: codigoPCN,
        pvn: codigoPVN,
        cantidadPedida: pedida,
        recibidoAnterior: anterior,
        recibidoAcumulado,
        diferencia,
        pendiente,
        estadoPedido: estado,

        observaciones: observaciones.value.trim(),
        fecha: serverTimestamp()
    });

    alert(`✅ Entrada registrada\n${codigoPCN} ↔ ${codigoPVN}\nPedido: ${pedida}\nRecibido acumulado: ${recibidoAcumulado}\nPendiente: ${pendiente}\nEstado: ${estado}`);
    location.reload();
});

cargarDatos();
