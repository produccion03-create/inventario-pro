import {
    db,
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    where
} from "./firebase.js";

async function cargarDiferencias() {

    const lista = document.getElementById("lista");

    lista.innerHTML = "";

    const datos = await getDocs(
        collection(db, "inventario")
    );

    if (datos.empty) {

        lista.innerHTML =
        "<h2>✅ No hay conteos realizados.</h2>";

        return;

    }

    datos.forEach((registro)=>{

        const i = registro.data();

        const color =
        i.diferencia == 0
        ? "#16a34a"
        : "#dc2626";

        lista.innerHTML += `

        <div class="movimiento">

            <h3>📦 ${i.producto}</h3>

            <p><b>Código:</b> ${i.codigo}</p>

            <p><b>Categoría:</b> ${i.categoria}</p>

            <p><b>Sistema:</b> ${i.stockSistema}</p>

            <p><b>Contado:</b> ${i.stockContado}</p>

            <p style="color:${color};font-weight:bold;">

                Diferencia:
                ${i.diferencia}

            </p>

            ${
                i.diferencia != 0
                ?

                `<button onclick="actualizarStock(
                    '${i.codigo}',
                    ${i.stockContado}
                )">

                ✅ Actualizar stock

                </button>`

                :

                "<p>✔ Sin diferencias</p>"
            }

        </div>

        `;

    });

}

window.actualizarStock = async function(codigo,nuevoStock){

    const consulta = query(
        collection(db,"productos"),
        where("codigo","==",codigo)
    );

    const datos = await getDocs(consulta);

    datos.forEach(async(documento)=>{

        await updateDoc(

            doc(
                db,
                "productos",
                documento.id
            ),

            {

                stock:nuevoStock

            }

        );

    });

    alert("✅ Stock actualizado");

    cargarDiferencias();

}

cargarDiferencias();