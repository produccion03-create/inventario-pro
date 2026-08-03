import {
    db,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    serverTimestamp
} from "./firebase.js";

let productoActual = null;
let documentoActual = null;

async function encontrado(decodedText) {

    const codigo = decodedText;

    console.log("Código leído:", codigo);

    const resultado = document.getElementById("resultado");
    const panelMovimiento = document.getElementById("panelMovimiento");

    try {

        const consulta = query(
            collection(db, "productos"),
            where("codigo", "==", codigo)
        );

        const datos = await getDocs(consulta);

        if (datos.empty) {

            resultado.innerHTML = `
                <h2>❌ Producto no encontrado</h2>

                <p>Código: <b>${codigo}</b></p>

                <p>Este código no existe en la base de datos.</p>
            `;

            panelMovimiento.style.display = "none";

            return;
        }

        datos.forEach((documento) => {

            documentoActual = documento.id;
            productoActual = documento.data();

        });

        mostrarProducto();

    } catch (error) {

        console.error(error);

        resultado.innerHTML = "❌ Error al consultar Firebase";

    }

}

function mostrarProducto() {

    const resultado = document.getElementById("resultado");

    const minimo = Number(productoActual.stockMinimo ?? 5);

    resultado.innerHTML = `

        <h2>📦 ${productoActual.nombre}</h2>

        <hr>

        <p><b>🏷 Código:</b> ${productoActual.codigo}</p>

        <p><b>📂 Categoría:</b> ${productoActual.categoria}</p>

        <p>

            <b>📦 Stock:</b>

            <span id="stock" style="
                font-size:28px;
                font-weight:bold;
                color:${
                    Number(productoActual.stock) === 0
                    ? "#dc2626"
                    : Number(productoActual.stock) <= minimo
                    ? "#f59e0b"
                    : "#16a34a"
                };
            ">

                ${productoActual.stock}

            </span>

        </p>

        <p><b>⚠️ Stock mínimo:</b> ${minimo}</p>

        <p><b>💰 Precio:</b> ${productoActual.precio} €</p>

        <p>

            <b>💵 Valor stock:</b>

            ${(Number(productoActual.stock) * Number(productoActual.precio)).toFixed(2)} €

        </p>

    `;

    document.getElementById("panelMovimiento").style.display = "block";

}

async function registrarMovimiento(tipo) {

    if (!productoActual) return;

    let cantidad = Number(document.getElementById("cantidad").value);

    if (cantidad <= 0 || isNaN(cantidad)) {

        alert("Cantidad incorrecta");

        return;

    }

    let nuevoStock = Number(productoActual.stock);

    if (tipo === "Entrada") {

        nuevoStock += cantidad;

    } else {

        if (cantidad > nuevoStock) {

            alert("No hay suficiente stock");

            return;

        }

        nuevoStock -= cantidad;

    }

    await updateDoc(

        doc(db, "productos", documentoActual),

        {

            stock: nuevoStock,
            revisado: false

        }

    );

    await addDoc(

        collection(db, "movimientos"),

        {

            tipo: tipo,

            codigo: productoActual.codigo,

            producto: productoActual.nombre,

            categoria: productoActual.categoria,

            cantidad: cantidad,

            stockAnterior: productoActual.stock,

            stockFinal: nuevoStock,

            fecha: serverTimestamp()

        }

    );

    productoActual.stock = nuevoStock;

    productoActual.revisado = false;

    mostrarProducto();

    document.getElementById("cantidad").value = 1;

    alert("✅ " + tipo + " registrada correctamente");

}

document
    .getElementById("entrada")
    .addEventListener("click", () => {

        registrarMovimiento("Entrada");

    });

document
    .getElementById("salida")
    .addEventListener("click", () => {

        registrarMovimiento("Salida");

    });

const scanner = new Html5QrcodeScanner(

    "lector",

    {

        fps: 10,

        qrbox: 250

    }

);

scanner.render(encontrado);