import {
    db,
    collection,
    getDocs,
    doc,
    updateDoc
} from "./firebase.js";

async function cargarPendientes() {

    const lista = document.getElementById("listaPendientes");

    lista.innerHTML = "";

    const datos = await getDocs(
        collection(db, "productos")
    );

    let encontrados = 0;

    datos.forEach((documento) => {

        const p = documento.data();

        const stock = Number(p.stock) || 0;
        const minimo = Number(p.stockMinimo ?? 5);

        if (stock <= minimo && !p.revisado) {

            encontrados++;

            lista.innerHTML += `

            <div class="movimiento">

                <h2>📦 ${p.nombre}</h2>

                <p><b>Código:</b> ${p.codigo}</p>

                <p><b>Categoría:</b> ${p.categoria}</p>

                <p>
                    <b>Stock:</b>
                    <span style="color:red;">
                        ${stock}
                    </span>
                </p>

                <p><b>Stock mínimo:</b> ${minimo}</p>

                <button
                onclick="marcarRevisado('${documento.id}')">

                ✔ Marcar como revisado

                </button>

            </div>

            <br>

            `;

        }

    });

    if (encontrados === 0) {

        lista.innerHTML =
        "✅ No hay productos pendientes.";

    }

}

async function marcarRevisado(id) {

    await updateDoc(

        doc(db, "productos", id),

        {

            revisado: true

        }

    );

    cargarPendientes();

}

window.marcarRevisado = marcarRevisado;

cargarPendientes();