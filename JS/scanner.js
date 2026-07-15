import {
    db,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    
} from "./firebase.js";

async function encontrado(decodedText) {

    const codigo = decodedText;

    console.log("Código leído:", codigo);

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

        datos.forEach((documento) => {

            const p = documento.data();

            resultado.innerHTML = `
                <h2>📦 ${p.nombre}</h2>

                <p><b>Código:</b> ${p.codigo}</p>

                <p><b>Stock:</b>
                <span id="stock">${p.stock}</span></p>

                <p><b>Ubicación:</b> ${p.ubicacion}</p>

                <p><b>Precio:</b> ${p.precio} €</p>

                <button id="entrada">📥 Entrada</button>

                <button id="salida">📤 Salida</button>
            `;

            // ==========================
            // ENTRADA
            // ==========================

            document.getElementById("entrada").onclick = async () => {

                let cantidad = prompt("¿Cuántas unidades entran?");

                if (cantidad === null) return;

                cantidad = Number(cantidad);

                if (isNaN(cantidad) || cantidad <= 0) {

                    alert("Cantidad incorrecta");
                    return;

                }

                let nuevoStock = Number(p.stock) + cantidad;

                await updateDoc(
                    doc(db, "productos", documento.id),
                    {
                        stock: nuevoStock
                    }
                );

                await addDoc(
                    collection(db, "movimientos"),
                    {
                        producto: p.nombre,
                        codigo: p.codigo,
                        tipo: "Entrada",
                        cantidad: cantidad,
                        stockFinal: nuevoStock,
                        fecha: new Date()
                    }
                );

                p.stock = nuevoStock;

                document.getElementById("stock").textContent = nuevoStock;

                alert("✅ Entrada registrada");

            };

            // ==========================
            // SALIDA
            // ==========================

            document.getElementById("salida").onclick = async () => {

                let cantidad = prompt("¿Cuántas unidades salen?");

                if (cantidad === null) return;

                cantidad = Number(cantidad);

                if (isNaN(cantidad) || cantidad <= 0) {

                    alert("Cantidad incorrecta");
                    return;

                }

                if (cantidad > Number(p.stock)) {

                    alert("No hay suficiente stock");
                    return;

                }

                let nuevoStock = Number(p.stock) - cantidad;

                await updateDoc(
                    doc(db, "productos", documento.id),
                    {
                        stock: nuevoStock
                    }
                );

                await addDoc(
                    collection(db, "movimientos"),
                    {
                        producto: p.nombre,
                        codigo: p.codigo,
                        tipo: "Salida",
                        cantidad: cantidad,
                        stockFinal: nuevoStock,
                       fecha: new Date()
                    }
                );

                p.stock = nuevoStock;

                document.getElementById("stock").textContent = nuevoStock;

                alert("✅ Salida registrada");

            };

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