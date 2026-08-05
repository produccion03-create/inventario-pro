import {
    db,
    collection,
    getDocs,
    query,
    orderBy
} from "./firebase.js";


let movimientos = [];


// ==========================
// CARGAR MOVIMIENTOS
// ==========================

async function cargarMovimientos(){

    try{

        const consulta = query(
            collection(db,"movimientos"),
            orderBy("fecha","desc")
        );


        const datos = await getDocs(consulta);


        movimientos=[];


        datos.forEach((doc)=>{

            movimientos.push({

                id:doc.id,
                ...doc.data()

            });

        });


        cargarCategorias();

        mostrarMovimientos();


    }catch(error){

        console.error(error);

        document.getElementById(
            "listaMovimientos"
        ).innerHTML=

        `

        <div class="panel">

        ❌ Error cargando movimientos

        </div>

        `;

    }

}




// ==========================
// FECHA FORMATO
// ==========================


function formatoFecha(fecha){


    if(
        fecha &&
        fecha.toDate
    ){

        return fecha
        .toDate()
        .toLocaleString("es-ES");

    }


    return "";

}





// ==========================
// CATEGORIAS
// ==========================


function cargarCategorias(){


    const select =
    document.getElementById(
        "filtroCategoria"
    );


    select.innerHTML=

    `
    <option value="">
    Todas las categorías
    </option>
    `;



    const categorias=[];



    movimientos.forEach((m)=>{


        if(
            m.categoria &&
            !categorias.includes(m.categoria)
        ){

            categorias.push(
                m.categoria
            );

        }


    });



    categorias.sort();



    categorias.forEach((categoria)=>{


        select.innerHTML +=

        `

        <option value="${categoria}">
        ${categoria}
        </option>

        `;


    });


}





// ==========================
// FILTROS
// ==========================


function obtenerFiltrados(){


    const texto =
    document
    .getElementById("buscar")
    .value
    .toLowerCase();



    const tipo =
    document
    .getElementById("filtroTipo")
    .value;



    const categoria =
    document
    .getElementById("filtroCategoria")
    .value;



    const desde =
    document
    .getElementById("fechaDesde")
    .value;



    const hasta =
    document
    .getElementById("fechaHasta")
    .value;



    return movimientos.filter((m)=>{


        const producto =
        (m.producto || "")
        .toLowerCase();



        const codigo =
        (m.codigo || "")
        .toLowerCase();



        if(
            texto &&
            !producto.includes(texto) &&
            !codigo.includes(texto)
        ){

            return false;

        }




        if(
            tipo &&
            m.tipo !== tipo
        ){

            return false;

        }




        if(
            categoria &&
            m.categoria !== categoria
        ){

            return false;

        }





        if(
            m.fecha &&
            m.fecha.toDate
        ){

            const fecha =
            m.fecha.toDate();



            if(desde){

                if(
                    fecha <
                    new Date(desde)
                ){

                    return false;

                }

            }



            if(hasta){

                const final =
                new Date(hasta);


                final.setHours(
                    23,
                    59,
                    59,
                    999
                );


                if(fecha > final){

                    return false;

                }

            }

        }



        return true;


    });


}






// ==========================
// MOSTRAR
// ==========================


function mostrarMovimientos(){


    const datos =
    obtenerFiltrados();



    let entradas=0;

    let salidas=0;

    let unidadesEntrada=0;

    let unidadesSalida=0;



    datos.forEach((m)=>{


        const cantidad =
        Number(m.cantidad)||0;



        if(
            m.tipo==="Entrada"
        ){

            entradas++;

            unidadesEntrada += cantidad;


        }else{


            salidas++;

            unidadesSalida += cantidad;


        }


    });



    document.getElementById(
        "totalEntradas"
    ).textContent =
    unidadesEntrada;



    document.getElementById(
        "totalSalidas"
    ).textContent =
    unidadesSalida;



    document.getElementById(
        "totalBalance"
    ).textContent =
    unidadesEntrada-unidadesSalida;



    document.getElementById(
        "totalMovimientos"
    ).textContent =
    datos.length;




    const contenedor =
    document.getElementById(
        "listaMovimientos"
    );



    if(datos.length===0){


        contenedor.innerHTML=

        `

        <div class="panel">

        📭 No hay movimientos encontrados

        </div>

        `;


        return;

    }





    let html=

    `

<table class="tabla-productos">


<thead>

<tr>

<th>Fecha</th>

<th>Tipo</th>

<th>Código</th>

<th>Producto</th>

<th>Categoría</th>

<th>Cantidad</th>

<th>Stock anterior</th>

<th>Stock final</th>


</tr>


</thead>


<tbody>

`;





    datos.forEach((m)=>{


        const clase =
        m.tipo==="Entrada"
        ?"ok"
        :"sin";



        const icono =
        m.tipo==="Entrada"
        ?"📥"
        :"📤";



        html +=


        `

<tr class="${clase}">


<td>
${formatoFecha(m.fecha)}
</td>


<td>
${icono} ${m.tipo}
</td>


<td>
${m.codigo || ""}
</td>


<td>
${m.producto || ""}
</td>


<td>
${m.categoria || ""}
</td>


<td>
${m.cantidad || 0}
</td>


<td>
${m.stockAnterior || 0}
</td>


<td>
${m.stockFinal || 0}
</td>


</tr>

`;



    });



    html+=

    `

</tbody>

</table>

`;



    contenedor.innerHTML=html;


}






// ==========================
// EXCEL
// ==========================


function exportarExcel(){


    const datos =
    obtenerFiltrados();



    const filas =
    datos.map((m)=>({


        Fecha:
        formatoFecha(m.fecha),


        Tipo:m.tipo,


        Codigo:m.codigo,


        Producto:m.producto,


        Categoria:m.categoria,


        Cantidad:m.cantidad,


        Stock_anterior:
        m.stockAnterior,


        Stock_final:
        m.stockFinal


    }));



    const libro =
    XLSX.utils.book_new();



    const hoja =
    XLSX.utils.json_to_sheet(
        filas
    );



    XLSX.utils.book_append_sheet(
        libro,
        hoja,
        "Movimientos"
    );



    XLSX.writeFile(
        libro,
        "Movimientos.xlsx"
    );


}






// ==========================
// PDF
// ==========================


function exportarPDF(){


    const datos =
    obtenerFiltrados();



    const {jsPDF}=window.jspdf;



    const pdf =
    new jsPDF();



    pdf.text(
        "Inventario Pro - Movimientos",
        14,
        15
    );



    pdf.autoTable({

        startY:25,

        head:[[
            "Fecha",
            "Tipo",
            "Producto",
            "Cantidad"
        ]],


        body:

        datos.map((m)=>[

            formatoFecha(m.fecha),

            m.tipo,

            m.producto,

            m.cantidad

        ])

    });



    pdf.save(
        "Movimientos.pdf"
    );


}






// ==========================
// IMPRIMIR
// ==========================


function imprimir(){

    window.print();

}





// ==========================
// EVENTOS
// ==========================


[
"buscar",
"filtroTipo",
"filtroCategoria",
"fechaDesde",
"fechaHasta"

].forEach(id=>{


document
.getElementById(id)
.addEventListener(
"input",
mostrarMovimientos
);


});



document
.getElementById(
"limpiarFiltros"
)
.addEventListener(
"click",
()=>{


[
"buscar",
"fechaDesde",
"fechaHasta"

].forEach(id=>{

document
.getElementById(id)
.value="";

});


document
.getElementById(
"filtroTipo"
)
.value="";


document
.getElementById(
"filtroCategoria"
)
.value="";


mostrarMovimientos();


});




document
.getElementById(
"exportarExcel"
)
.addEventListener(
"click",
exportarExcel
);



document
.getElementById(
"exportarPDF"
)
.addEventListener(
"click",
exportarPDF
);



document
.getElementById(
"imprimirMovimientos"
)
.addEventListener(
"click",
imprimir
);






// INICIO

cargarMovimientos();