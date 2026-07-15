import {
    db,
    collection,
    getDocs
} from "./firebase.js";

async function cargarMovimientos() {

    const lista = document.getElementById("listaMovimientos");

    lista.innerHTML = "";

    const datos = await getDocs(collection(db, "movimientos"));

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