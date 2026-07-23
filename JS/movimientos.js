import {
    db,
    collection,
    getDocs,
    query,
    orderBy
} from "./firebase.js";

async function cargarMovimientos() {

    const lista = document.getElementById("listaMovimientos");

    lista.innerHTML = "";

    const consulta = query(
        collection(db, "movimientos"),
        orderBy("fecha", "desc")
    );

    const datos = await getDocs(consulta);

    if (datos.empty) {

        lista.innerHTML = `
            <div class="panel">
                No hay movimientos registrados.
            </div>
        `;

        return;
    }

    datos.forEach((documento) => {

        const m = documento.data();

        let fecha = "Sin fecha";

        if (m.fecha && m.fecha.toDate) {
            fecha = m.fecha.toDate().toLocaleString("es-ES");
        }

        const icono = m.tipo === "Entrada" ? "🟢" : "🔴";
        const texto = m.tipo === "Entrada" ? "Entrada" : "Salida";
        const borde = m.tipo === "Entrada" ? "#16a34a" : "#dc2626";

        lista.innerHTML += `

            <div class="movimiento" style="border-left:6px solid ${borde};">

                <h3>${icono} ${texto}</h3>

                <p><strong>📦 Producto:</strong> ${m.producto}</p>

                <p><strong>📊 Cantidad:</strong> ${m.cantidad}</p>

                <p><strong>🕒 Fecha:</strong> ${fecha}</p>

            </div>

        `;

    });

}

cargarMovimientos();