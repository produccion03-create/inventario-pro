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
            <div class="producto">

                <b>${m.producto}</b><br>

                Código: ${m.codigo}<br>

                Tipo: ${m.tipo}<br>

                Cantidad: ${m.cantidad}<br>

                Stock final: ${m.stockFinal}<br>

                Fecha: ${fecha}

                <hr>

            </div>
        `;

    });

}

cargarMovimientos();