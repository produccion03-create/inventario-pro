import {
    db,
    collection,
    getDocs,
    addDoc,
    doc,
    setDoc
} from "./firebase.js";

import { INVENTARIO_AGOSTO_2026 } from "./inventario-agosto-2026.js";

const btn = document.getElementById("btnImportar");
const resumen = document.getElementById("resumenImportacion");
const panel = document.getElementById("panelProgreso");
const progreso = document.getElementById("progresoImportacion");
const detalle = document.getElementById("detalleImportacion");

function normalizar(v) {
    return String(v ?? "").trim().toLowerCase();
}

function claveFila(p) {
    return `${normalizar(p.origenExcel)}|${Number(p.excelFila || 0)}`;
}

async function importar() {
    btn.disabled = true;
    panel.hidden = false;
    progreso.value = 0;
    progreso.max = INVENTARIO_AGOSTO_2026.length;
    detalle.textContent = "Leyendo productos existentes...";
    resumen.textContent = "";

    try {
        const snap = await getDocs(collection(db, "productos"));
        const porFila = new Map();

        snap.forEach(d => {
            const p = d.data();
            if (p.origenExcel && p.excelFila) {
                porFila.set(claveFila(p), { id: d.id, ...p });
            }
        });

        let creados = 0;
        let actualizados = 0;
        let errores = 0;

        for (let i = 0; i < INVENTARIO_AGOSTO_2026.length; i++) {
            const p = INVENTARIO_AGOSTO_2026[i];
            const datos = {
                ...p,
                categoria: p.familia,
                actualizadoDesdeExcel: new Date().toISOString()
            };

            try {
                const existente = porFila.get(claveFila(p));
                if (existente) {
                    await setDoc(doc(db, "productos", existente.id), datos, { merge: true });
                    actualizados++;
                } else {
                    await addDoc(collection(db, "productos"), datos);
                    creados++;
                }
            } catch (e) {
                console.error("Error fila", p.excelFila, e);
                errores++;
            }

            progreso.value = i + 1;
            detalle.textContent = `${i + 1} / ${INVENTARIO_AGOSTO_2026.length} productos procesados`;
        }

        resumen.innerHTML =
            `<strong>Actualización terminada.</strong><br>` +
            `Productos totales preparados: ${INVENTARIO_AGOSTO_2026.length}<br>` +
            `Nuevos: ${creados}<br>` +
            `Actualizados: ${actualizados}<br>` +
            `Errores: ${errores}<br><br>` +
            `<strong>Familias:</strong><br>` +
            `• Stock de planchas: Tacos + Planchas EVA<br>` +
            `• Envases y embalaje<br>` +
            `• Materias primas auxiliares<br>` +
            `• Stock de productos terminados`;
    } catch (e) {
        console.error(e);
        resumen.textContent = `ERROR: ${e.message}`;
    } finally {
        btn.disabled = false;
    }
}

btn.addEventListener("click", importar);
