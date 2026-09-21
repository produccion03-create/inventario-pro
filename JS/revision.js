import {
    db,
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    serverTimestamp
} from "./firebase.js";

const FAMILIAS = [
    "Stock de planchas",
    "Envases y embalaje",
    "Materias primas auxiliares",
    "Stock de productos terminados"
];

const categoria = document.getElementById("categoria");
const contador = document.getElementById("contadorRevision");
const panel = document.getElementById("panelRevision");
const nombre = document.getElementById("nombreProducto");
const codigo = document.getElementById("codigoProducto");
const material = document.getElementById("materialProducto");
const descripcion = document.getElementById("descripcionProducto");
const formato = document.getElementById("formatoProducto");
const proveedor = document.getElementById("proveedorProducto");
const stockSistema = document.getElementById("stockSistema");
const stockFisico = document.getElementById("stockFisico");
const marcar = document.getElementById("marcarRevisado");
const anterior = document.getElementById("anteriorProducto");
const siguiente = document.getElementById("siguienteProducto");
const panelPendientes = document.getElementById("panelPendientes");

let todos = [];
let lista = [];
let indice = 0;
let revisiones = new Map();

const ahora = new Date();
const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;

function txt(v) {
    return String(v ?? "").trim();
}

async function cargar() {
    contador.textContent = "Cargando inventario...";

    const [productosSnap, revisionesSnap] = await Promise.all([
        getDocs(collection(db, "productos")),
        getDocs(collection(db, "revisionesStock"))
    ]);

    todos = productosSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.revisionStock === true && FAMILIAS.includes(p.familia || p.categoria));

    revisiones.clear();
    revisionesSnap.forEach(d => {
        const r = d.data();
        if (r.mes === mesActual && r.productoId) {
            revisiones.set(r.productoId, r);
        }
    });

    categoria.innerHTML = `<option value="">Selecciona una familia...</option>`;
    FAMILIAS.forEach(f => {
        const cantidad = todos.filter(p => (p.familia || p.categoria) === f).length;
        if (cantidad > 0) {
            const op = document.createElement("option");
            op.value = f;
            op.textContent = `${f} (${cantidad})`;
            categoria.appendChild(op);
        }
    });

    contador.textContent = `${todos.length} productos disponibles para revisión`;
}

function cargarFamilia() {
    const fam = categoria.value;
    if (!fam) {
        panel.hidden = true;
        panelPendientes.hidden = true;
        contador.textContent = `${todos.length} productos disponibles para revisión`;
        return;
    }

    lista = todos
        .filter(p => (p.familia || p.categoria) === fam)
        .sort((a, b) => {
            const sub = txt(a.subfamilia).localeCompare(txt(b.subfamilia), "es");
            if (sub !== 0) return sub;
            return Number(a.excelFila || 0) - Number(b.excelFila || 0);
        });

    indice = 0;
    panel.hidden = lista.length === 0;
    panelPendientes.hidden = lista.length === 0;
    mostrar();
}

function mostrar() {
    if (!lista.length) return;

    const p = lista[indice];
    const rev = revisiones.get(p.id);

    nombre.textContent = p.nombre || "Sin nombre";
    codigo.textContent = p.codigo || "—";
    material.textContent = [p.subfamilia, p.material].filter(Boolean).join(" · ") || "—";
    descripcion.textContent = p.descripcion || "—";
    formato.textContent = p.formato || "—";
    proveedor.textContent = p.proveedor || "—";
    stockSistema.textContent = Number(p.stock ?? 0);
    stockFisico.value = rev?.stockFisico ?? "";
    marcar.checked = Boolean(rev?.revisado);

    anterior.disabled = indice === 0;
    siguiente.disabled = indice >= lista.length - 1;

    const revisados = lista.filter(x => revisiones.get(x.id)?.revisado).length;
    contador.textContent = `${categoria.value}: ${indice + 1} / ${lista.length} · Revisados ${revisados} · Pendientes ${lista.length - revisados}`;

    mostrarPendientes();
}

function mostrarPendientes() {
    const pendientes = lista.filter(p => !revisiones.get(p.id)?.revisado);
    panelPendientes.innerHTML = `
        <strong>Pendientes (${pendientes.length})</strong>
        <div style="margin-top:8px; max-height:160px; overflow:auto;">
            ${pendientes.slice(0, 30).map(p =>
                `<div>• ${p.nombre || p.codigo || "Sin nombre"}${p.formato ? ` — ${p.formato}` : ""}</div>`
            ).join("")}
            ${pendientes.length > 30 ? `<div>… y ${pendientes.length - 30} más</div>` : ""}
        </div>
    `;
}

async function guardarRevision() {
    if (!lista.length) return;
    const p = lista[indice];
    const fisico = Number(stockFisico.value);
    if (!Number.isFinite(fisico)) {
        alert("Introduce el stock físico.");
        stockFisico.focus();
        return;
    }

    const datos = {
        productoId: p.id,
        codigo: p.codigo || "",
        nombreProducto: p.nombre || "",
        familia: p.familia || p.categoria || "",
        subfamilia: p.subfamilia || "",
        material: p.material || "",
        descripcion: p.descripcion || "",
        formato: p.formato || "",
        stockSistema: Number(p.stock ?? 0),
        stockFisico: fisico,
        diferencia: fisico - Number(p.stock ?? 0),
        mes: mesActual,
        revisado: true,
        fechaRevision: serverTimestamp()
    };

    await setDoc(doc(db, "revisionesStock", `${mesActual}_${p.id}`), datos, { merge: true });
    revisiones.set(p.id, { ...datos, fechaRevision: new Date() });
    marcar.checked = true;
    mostrar();

    if (indice < lista.length - 1) {
        indice++;
        mostrar();
        stockFisico.focus();
    }
}

categoria.addEventListener("change", cargarFamilia);
anterior.addEventListener("click", () => {
    if (indice > 0) {
        indice--;
        mostrar();
    }
});
siguiente.addEventListener("click", () => {
    if (indice < lista.length - 1) {
        indice++;
        mostrar();
    }
});
marcar.addEventListener("change", async () => {
    if (marcar.checked) {
        await guardarRevision();
    }
});

cargar().catch(e => {
    console.error(e);
    contador.textContent = `Error cargando inventario: ${e.message}`;
});
