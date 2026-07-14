import {
    db,
    collection,
    getDocs,
    query,
    where
} from "./firebase.js";

async function encontrado(codigo) {

    console.log("Código leído:", codigo);
    alert("Código leído: " + codigo);

    const resultado = document.getElementById("resultado");

    try {

        const consulta = query(
            collection(db, "productos"),
            where("codigo", "==", codigo)
        );

        const datos = await getDocs(consulta);

        if (datos.empty) {

            resultado.innerHTML = `
            ❌ Producto no encontrado<br>
            Código: ${codigo}
            `;

            return;
        }

        datos.forEach((doc) => {

            const p = doc.data();

            resultado.innerHTML = `
            📦 <b>${p.nombre}</b><br>
            Código: ${p.codigo}<br>
            Stock: ${p.stock}<br>
            Ubicación: ${p.ubicacion}<br>
            Precio: ${p.precio} €
            `;

        });

    } catch (error) {

        console.error(error);

        resultado.innerHTML = "❌ Error al consultar Firebase";

    }

}

const scanner = new Html5QrcodeScanner(
    "lector",
    {
        fps: 10,
        qrbox: 250
    }
);

scanner.render(encontrado);