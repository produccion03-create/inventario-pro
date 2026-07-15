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

        lista.innerHTML = "No hay movimientos registrados.";
        return;

    }

    datos.forEach((documento) => {

        const m = documento.data();

        let fecha = "";

        if (m.fecha && m.fecha.toDate) {
            fecha = m.fecha.toDate().toLocaleString();
        }

lista.innerHTML += `
<div class="movimiento">

    <h3>📦 ${m.producto}</h3>

    <p><b>🏷 Código:</b> ${m.codigo}</p>

    <p><b>${m.tipo === "Entrada" ? "📥 Entrada" : "📤 Salida"}</b></p>

    <p><b>📦 Cantidad:</b> ${m.cantidad}</p>

    <p><b>📊 Stock final:</b> ${m.stockFinal}</p>

    <p><b>🕒 Fecha:</b> ${fecha}</p>

</div>
`;

    });

}

cargarMovimientos();