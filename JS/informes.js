import {
    db,
    collection,
    getDocs
} from "./firebase.js";
import {familiaDe} from "./familias.js";


let productos = [];
let movimientos = [];


// ==========================
// CARGAR DATOS
// ==========================

async function cargarDatos(){

    try{

        const [productosDB, movimientosDB] = await Promise.all([

            getDocs(collection(db,"productos")),

            getDocs(collection(db,"movimientos"))

        ]);


        productos=[];

        movimientos=[];


        productosDB.forEach(doc=>{

            productos.push({
                id:doc.id,
                ...doc.data()
            });

        });


        movimientosDB.forEach(doc=>{

            movimientos.push({
                id:doc.id,
                ...doc.data()
            });

        });


        generarInforme();


    }catch(error){

        console.error(error);

    }

}





// ==========================
// INFORME GENERAL
// ==========================


function generarInforme(){


    let valorTotal=0;

    let unidades=0;

    let bajo=0;

    let sin=0;


    const categorias={};


    productos.forEach(p=>{


        const stock=Number(p.stock)||0;

        const precio=Number(p.precio)||0;

        const minimo=Number(p.stockMinimo ?? 5);


        unidades+=stock;

        valorTotal+=stock*precio;


        if(stock===0){

            sin++;

        }


        if(stock>0 && stock<=minimo){

            bajo++;

        }


        const cat=familiaDe(p) || "Sin categoría";


        if(!categorias[cat]){

            categorias[cat]={
                cantidad:0,
                valor:0
            };

        }


        categorias[cat].cantidad++;

        categorias[cat].valor += stock*precio;


    });




    document.getElementById("totalProductos").textContent=
    productos.length;


    document.getElementById("valorAlmacen").textContent=
    valorTotal.toLocaleString("es-ES",{
        style:"currency",
        currency:"EUR"
    });


    document.getElementById("totalUnidades").textContent=
    unidades;


    document.getElementById("stockBajo").textContent=
    bajo;


    document.getElementById("sinStock").textContent=
    sin;




    crearGraficoCategorias(categorias);

    crearGraficoValor(categorias);

    crearGraficoMovimientos();

    crearGraficoProductosMovidos();


    mostrarListados(categorias);

}





// ==========================
// GRAFICOS
// ==========================


function destruir(id){

    const c=document.getElementById(id);

    const g=Chart.getChart(c);

    if(g){

        g.destroy();

    }

}





function crearGraficoCategorias(categorias){


    destruir("graficoInformes");


    new Chart(

        document.getElementById("graficoInformes"),

        {

        type:"doughnut",

        data:{

            labels:Object.keys(categorias),

            datasets:[{

                data:Object.values(categorias)
                .map(x=>x.cantidad)

            }]

        }

        }

    );

}





function crearGraficoValor(categorias){


    destruir("graficoValorCategorias");


    new Chart(

        document.getElementById("graficoValorCategorias"),

        {

        type:"bar",

        data:{

            labels:Object.keys(categorias),

            datasets:[{

                label:"€",

                data:Object.values(categorias)
                .map(x=>x.valor)

            }]

        }

        }

    );

}





function crearGraficoMovimientos(){


    destruir("graficoMovimientos");


    const meses={};


    movimientos.forEach(m=>{


        if(!m.fecha?.toDate)return;


        const fecha=m.fecha.toDate();


        const mes=
        fecha.toLocaleString(
            "es-ES",
            {month:"short"}
        );


        if(!meses[mes]){

            meses[mes]={
                entrada:0,
                salida:0
            };

        }


        if(m.tipo==="Entrada"){

            meses[mes].entrada+=Number(m.cantidad)||0;

        }else{

            meses[mes].salida+=Number(m.cantidad)||0;

        }


    });



    new Chart(

        document.getElementById("graficoMovimientos"),

        {

        type:"bar",

        data:{

            labels:Object.keys(meses),

            datasets:[

            {

            label:"Entradas",

            data:Object.values(meses)
            .map(x=>x.entrada)

            },

            {

            label:"Salidas",

            data:Object.values(meses)
            .map(x=>x.salida)

            }

            ]

        }

        }

    );


}





function crearGraficoProductosMovidos(){


    destruir("graficoProductosMovidos");


    const ranking={};


    movimientos.forEach(m=>{


        ranking[m.producto]=
        (ranking[m.producto]||0)+
        (Number(m.cantidad)||0);


    });



    const datos=
    Object.entries(ranking)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,10);



    new Chart(

        document.getElementById("graficoProductosMovidos"),

        {

        type:"bar",

        data:{

            labels:datos.map(x=>x[0]),

            datasets:[{

                label:"Unidades",

                data:datos.map(x=>x[1])

            }]

        }

        }

    );

}





// ==========================
// LISTADOS
// ==========================


function mostrarListados(categorias){


    document.getElementById("informeCategorias").innerHTML=

    Object.entries(categorias)
    .map(([c,v])=>

    `<div class="fila-informe">
    <span>${c}</span>
    <strong>${v.valor.toFixed(2)} €</strong>
    </div>`

    ).join("");





    document.getElementById("informeStockBajo").innerHTML=

    productos.filter(p=>{

        const s=Number(p.stock)||0;

        return s>0 && s<=Number(p.stockMinimo??5);

    })
    .map(p=>

    `<div class="fila-informe">
    <span>${p.nombre}</span>
    <strong>${p.stock}</strong>
    </div>`

    ).join("") || "✅ Todo correcto";





    document.getElementById("informeSinStock").innerHTML=

    productos.filter(p=>

        Number(p.stock)===0

    )
    .map(p=>

    `<div class="fila-informe">
    <span>${p.nombre}</span>
    <strong>Agotado</strong>
    </div>`

    ).join("") || "✅ Sin agotados";






    document.getElementById("informeValor").innerHTML=

    [...productos]
    .sort((a,b)=>

    (b.stock*b.precio)-(a.stock*a.precio)

    )
    .slice(0,10)
    .map(p=>

    `<div class="fila-informe">
    <span>${p.nombre}</span>
    <strong>${(p.stock*p.precio).toFixed(2)} €</strong>
    </div>`

    ).join("");

}





function productosExportacion(){
 const f=document.getElementById("familiaExportar")?.value||"";
 return f?productos.filter(p=>familiaDe(p)===f):productos;
}
function nombreExportacion(prefijo){
 const f=document.getElementById("familiaExportar")?.value||"Todas";
 return prefijo+"_"+f.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/g,"_").replace(/^_|_$/g,"");
}

// ==========================
// EXPORTAR EXCEL
// ==========================


document.getElementById("exportarCSV")
?.addEventListener("click",()=>{

 const seleccion=productosExportacion();
 if(!seleccion.length){alert("No hay productos en la familia seleccionada.");return;}

 const totalPrecio=seleccion.reduce((s,p)=>s+(Number(p.precio)||0),0);
 const totalValor=seleccion.reduce((s,p)=>s+((Number(p.stock)||0)*(Number(p.precio)||0)),0);

 const filas=[
   {Producto:"TOTAL SUMA DE PRECIOS",Precio:totalPrecio},
   {Producto:"TOTAL VALOR STOCK (STOCK × PRECIO)",Valor:totalValor},
   {},
   ...seleccion.map(p=>({
     Referencia:p.codigo||"",
     Producto:p.nombre||"",
     Familia:familiaDe(p)||"",
     "Proveedor / Ubicación":p.proveedor||p.ubicacion||"",
     Formato:p.formato||"",
     Stock:Number(p.stock)||0,
     Precio:Number(p.precio)||0,
     Valor:(Number(p.stock)||0)*(Number(p.precio)||0)
   }))
 ];

 const hoja=XLSX.utils.json_to_sheet(filas);
 const libro=XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(libro,hoja,"Inventario");
 XLSX.writeFile(libro,nombreExportacion("Inventario_Pro")+".xlsx");
});



// ==========================
// PDF
// ==========================


document.getElementById("exportarPDF")
?.addEventListener("click",()=>{

 const seleccion=productosExportacion();
 if(!seleccion.length){alert("No hay productos en la familia seleccionada.");return;}

 const totalPrecio=seleccion.reduce((s,p)=>s+(Number(p.precio)||0),0);
 const totalValor=seleccion.reduce((s,p)=>s+((Number(p.stock)||0)*(Number(p.precio)||0)),0);

 const {jsPDF}=window.jspdf;
 const pdf=new jsPDF({orientation:"landscape"});

 pdf.text(`Inventario Pro - ${document.getElementById("familiaExportar")?.value || "Todas las familias"}`,15,15);
 pdf.setFont(undefined,"bold");
 pdf.setFontSize(13);
 pdf.text("TOTAL SUMA DE PRECIOS: "+totalPrecio.toLocaleString("es-ES",{style:"currency",currency:"EUR"}),15,25);
 pdf.text("TOTAL VALOR STOCK (STOCK x PRECIO): "+totalValor.toLocaleString("es-ES",{style:"currency",currency:"EUR"}),15,33);
 pdf.setFont(undefined,"normal");
 pdf.setFontSize(10);

 pdf.autoTable({
   startY:42,
   head:[["Referencia","Producto","Familia","Proveedor / Ubicación","Formato","Stock","Precio","Valor"]],
   body:seleccion.map(p=>[
     p.codigo||"",p.nombre||"",familiaDe(p)||"",p.proveedor||p.ubicacion||"",p.formato||"",
     Number(p.stock)||0,
     (Number(p.precio)||0).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})+" €",
     ((Number(p.stock)||0)*(Number(p.precio)||0)).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})+" €"
   ])
 });

 pdf.save(nombreExportacion("Informe_Inventario")+".pdf");
});


cargarDatos();