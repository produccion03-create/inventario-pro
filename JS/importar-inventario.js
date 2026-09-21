import {
    db,
    collection,
    getDocs,
    addDoc,
    doc,
    setDoc
} from "./firebase.js";

import { INVENTARIO_AGOSTO_2026 } from "./inventario-agosto-2026.js";

const btnImportar = document.getElementById("btnImportar");
const resumenImportacion = document.getElementById("resumenImportacion");
const panelProgreso = document.getElementById("panelProgreso");
const progresoImportacion = document.getElementById("progresoImportacion");
const detalleImportacion = document.getElementById("detalleImportacion");

const ORIGEN = "AGOSTO_2026_MATERIALES";

function normalizar(valor) {
    return String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

function claveProducto(producto) {
    if (producto.codigo) {
        return `codigo:${normalizar(producto.codigo)}`;
    }

    return [
        "datos",
        normalizar(producto.categoria),
        normalizar(producto.descripcion),
        normalizar(producto.formato)
    ].join("|");
}

async function obtenerProductosActuales() {
    const snapshot = await getDocs(collection(db, "productos"));

    return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
    }));
}

async function importarInventario() {
    btnImportar.disabled = true;
    panelProgreso.style.display = "block";
    detalleImportacion.innerHTML = "";
    resumenImportacion.textContent = "Actualizando inventario...";

    try {
        const actuales = await obtenerProductosActuales();

        const mapa = new Map();

        actuales.forEach((producto) => {
            mapa.set(claveProducto(producto), producto);
        });

        let creados = 0;
        let actualizados = 0;
        let errores = 0;

        for (let i = 0; i < INVENTARIO_AGOSTO_2026.length; i++) {
            const productoExcel = INVENTARIO_AGOSTO_2026[i];
            const clave = claveProducto(productoExcel);
            const existente = mapa.get(clave);

            const datos = {
                codigo: productoExcel.codigo || "",
                nombre: productoExcel.nombre || "",
                categoria: productoExcel.categoria || "SIN CATEGORÍA",
                material: productoExcel.material || "",
                descripcion: productoExcel.descripcion || "",
                color: productoExcel.color || "",
                proveedor: productoExcel.proveedor || "",
                formato: productoExcel.formato || "",
                stock: Number(productoExcel.stock || 0),
                seccionExcel: productoExcel.seccionExcel || "",
                excelFila: productoExcel.excelFila,
                origenExcel: ORIGEN,
                revisionStock: true
            };

            try {
                if (existente) {
                    await setDoc(
                        doc(db, "productos", existente.id),
                        datos,
                        { merge: true }
                    );

                    actualizados++;
                } else {
                    const nuevo = await addDoc(
                        collection(db, "productos"),
                        datos
                    );

                    mapa.set(clave, {
                        id: nuevo.id,
                        ...datos
                    });

                    creados++;
                }
            } catch (errorProducto) {
                console.error(
                    "Error importando:",
                    productoExcel,
                    errorProducto
                );
                errores++;
            }

            progresoImportacion.textContent =
                `${i + 1} / ${INVENTARIO_AGOSTO_2026.length}`;
        }

        resumenImportacion.textContent =
            `Importación terminada. ${creados} creados, ${actualizados} actualizados, ${errores} errores.`;

        detalleImportacion.innerHTML = `
            <p><strong>Total Excel:</strong> ${INVENTARIO_AGOSTO_2026.length}</p>
            <p><strong>Nuevos:</strong> ${creados}</p>
            <p><strong>Actualizados:</strong> ${actualizados}</p>
            <p><strong>Errores:</strong> ${errores}</p>
            <p><strong>Planchas:</strong> excluidas</p>
        `;

    } catch (error) {
        console.error("Error general importando inventario:", error);

        resumenImportacion.textContent =
            "No se pudo actualizar el inventario. Revisa la consola.";

        detalleImportacion.innerHTML = `
            <p>${String(error.message || error)}</p>
        `;
    } finally {
        btnImportar.disabled = false;
    }
}

resumenImportacion.textContent =
    `${INVENTARIO_AGOSTO_2026.length} productos preparados. Las filas Plancha están excluidas.`;

btnImportar.addEventListener("click", importarInventario);
