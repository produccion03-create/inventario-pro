import {
    db,
    collection,
    getDocs
} from "./firebase.js";
import {familiaDe} from "./familias.js";


const num=v=>{
 const n=Number(String(v ?? "").trim().replace(",","."));
 return Number.isFinite(n)?n:0;
};
const precioDe=p=>num(
 p.precio ?? p.precioUnitario ?? p.precio_unitario ?? p.precioUnidad ??
 p.coste ?? p.costo ?? p.valorUnitario ?? p.valor_unitario ?? 0
);


const ORDEN_AGOSTO={"Stock de planchas": {"TA003166": 0, "N:EVA BLANCO 13": 1, "TA000728": 2, "TA001300": 3, "TA000539": 4, "TA001301": 5, "TA001302": 6, "TA001303": 7, "TA001304": 8, "TA001305": 9, "TA001306": 10, "TA001307": 11, "TA001308": 12, "TA001309": 13, "TA000473": 14, "TA000524": 15, "TA000475": 16, "TA004628": 17, "TA000275": 18, "TA000639": 19, "TA002503": 20, "TA002965": 21, "TA002964": 22, "TA002504": 23, "TA003941": 24, "TA004252": 25, "TA004161": 26, "TA003942": 27, "TA003943": 28, "TA003944": 29, "TA004225": 30, "TA004226": 31, "TA002942": 32, "TA003113": 33, "TA002572": 34, "N:": 35, "TA003080": 36, "TA003192": 37, "TA001558": 38, "PF004933": 39, "PF005602": 40, "PF005613": 41, "PF004750": 42, "PF006118": 43, "PF005864": 44, "PF005499": 45, "TA002440": 46, "TA002439": 47, "VARIOS": 48, "PF010122": 49, "TA004108": 50, "N:NEGRO": 51, "TA000712": 52, "TA001329": 53, "TA001330": 54, "TA001331": 55, "TA001332": 56, "TA001333": 57, "TA001313": 58, "TA001311": 59, "TA001312": 60, "TA001310": 61, "TA001315": 62, "TA001314": 63, "PF000100": 64, "TA000430": 65, "TA000415": 66, "TA000434": 67, "TA000420": 68, "TA000433": 69, "TA000432": 70, "TA000439": 71, "TA000428": 72, "TA000429": 73, "TA000153": 74, "TA000416": 75, "TA000649": 76, "TA000427": 77, "TA000651": 78, "TA000431": 79, "TA000137": 80, "TA000421": 81, "TA000648": 82, "TA000647": 83, "TA000422": 84, "TA000650": 85, "TA001280": 86, "TA000495": 87, "TA000441": 88, "TA000418": 89, "TA000453": 90, "TA000384": 91, "TA000128": 92, "TA000383": 93, "TA000542": 94, "TA000543": 95, "TA000541": 96, "TA002299": 97, "TA002300": 98, "TA002301": 99, "TA000594": 100, "PF000148": 101, "PF000154": 102, "PF000151": 103, "PF000140": 104, "PF000143": 105, "PF000142": 106, "PF000150": 107, "PF000141": 108, "PF000147": 109, "PF000146": 110, "PF001409": 111, "PF002313": 112, "PF000152": 113, "PF001407": 114, "PF000149": 115, "PF000144": 116, "PF000145": 117, "PF000138": 118, "PF000133": 119, "PF000132": 120, "PF002623": 121, "PF000135": 122, "PF000136": 123, "PF000134": 124, "PF000139": 125, "PF001393": 126, "PF008695": 127, "PF000126": 128, "PF000111": 129, "PF000113": 130, "PF001619": 131, "PF000116": 132, "PF000117": 133, "PF000115": 134, "PF000109": 135, "PF000122": 136, "PF002710": 137, "PF000103": 138, "PF000123": 139, "PF000112": 140, "PF000101": 141, "PF000106": 142, "PF000107": 143, "PF000118": 144, "PF000108": 145, "PF000415": 146, "PF001553": 147, "PF000114": 148, "PF000121": 149, "PF0000415": 150, "PF007245": 151, "PF001385": 152, "PF001381": 153, "PF001386": 154, "PF005333": 155, "PF001814": 156, "PF005104": 157, "PF003168": 158, "PF007114": 159, "PF002205": 160, "PF007861": 161, "PF008819": 162, "PF007860": 163, "PF008460": 164, "PF002800": 165, "PF001391": 166, "PF001388": 167, "PF002798": 168, "TA000103": 169, "PF009021": 170, "PF002396": 171, "PF001387": 172, "PF002390": 173, "PF002386": 174, "PF009541": 175, "PF004220": 176, "PF009542": 177}, "Envases y embalaje": {"EMBALAJE": 0}, "Materias primas auxiliares": {"MATERIAPRIMAAUX.": 0}, "Stock de productos terminados": {"N:BANDELETAS STOCK SEGURIDAD": 0, "N:ROJO TIEMPO": 1, "N:VERDE ANIMALES": 2, "N:AZUL FRUTA": 3, "N:AMARILLO VEHICULOS": 4, "N:NARANJA DEPORTE": 5, "N:VIOLETA TIERRA": 6, "N:MARMOL AMARILLO": 7, "N:MARMOL ROJO": 8, "N:MARMOL FUXIA": 9, "N:MARMOL VIOLETA": 10, "N:MARMOL AZUL8": 11, "N:CAMUFLAJE CONFUSIUS": 12, "N:CAMUFLAJE NEWTON": 13, "N:CAMUFLAJE RUBENS": 14, "N:MARMOL VERDE": 15, "N:CAMUFLAJE WATT": 16, "N:CAMUFLAJE DA VINCI": 17, "N:CAMUFLAJE MARCO POLO": 18, "N:SIN SERIGRAFIA AZUL": 19, "N:SIN SERIGRAFIA ROJO": 20, "N:SIN SERIGRAFIA VIOLETA": 21, "N:SIN SERIGRAFIA AMARILLO": 22, "N:SIN SERIGRAFIA VERDE": 23, "N:SIN SERIGRAFIA NARANJA3": 24, "N:PACK CUBOS 4 COLORES": 25, "TA003942": 26, "TA003943": 27, "TA003941": 28, "TA004252": 29, "TA001558": 30, "N:NEGRO 120X60 HEXAGONO VENTOSA 10MM": 31, "PF00719": 32, "N:GRIS 7MM 140X60 S M": 33, "N:AZUL 7MM 140X60 S M": 34, "N:NEGRO 15MM 140X60 S M": 35, "N:GRIS 15MM 140X60 S M": 36, "N:NEGRO 10 MM 100X60 HEX VENTOSA": 37, "N:HIELO 10 MM 100X60 HEX VENTOSA": 38, "N:CAMEL 10MM 120X50 HEXAGONO VENTOSA": 39, "N:GRIS 15MM 140X60 S M DEFECTUASAS": 40, "N:NEGRO 10MM 160X60 YOGA": 41, "N:YOGA ONE KAKI": 42, "PF001037": 43, "PF004645": 44, "PF000996": 45, "PF000999": 46, "N:PALA EVA HERCULES TALLA 39 PAR AZUL": 47, "N:PALA EVA HERCULES TALLA 40 PAR AZUL": 48, "N:PALA EVA HERCULES TALLA 41 PAR AZUL": 49, "N:PALA EVA HERCULES TALLA 42 PAR AZUL": 50, "N:PALA EVA HERCULES TALLA 43 PAR AZUL": 51, "N:PALA EVA HERCULES TALLA 44 PAR NEGRO": 52, "N:PALA EVA HERCULES TALLA 45 PAR NEGRO": 53, "N:PALA EVA HERCULES TALLA 47 PAR NEGRO": 54, "N:PALA EVA HERCULES TALLA 39 PAR NEGRO": 55, "N:PALA EVA HERCULES TALLA 41 PAR NEGRO": 56, "N:ALMOHADILLLA TRABAJO PLEGABLE 50X120 CM LASER WHALEN 20MM NEG ROJ NEG": 57}};
const ORDEN_FAMILIAS=["Stock de planchas","Envases y embalaje","Materias primas auxiliares","Stock de productos terminados"];
const claveOrdenCodigo=v=>String(v??"").trim().toUpperCase().replace(/\s+/g,"");
const claveOrdenNombre=v=>String(v??"").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Z0-9]+/g," ").trim().replace(/\s+/g," ");
function posicionAgostoInforme(p){
 const fila=Number(p.excelFila);
 const origen=String(p.origenExcel||p.origen||p.importacion||"").toUpperCase();
 if(Number.isFinite(fila) && fila>0 && origen.includes("AGOSTO")) return fila;
 const f=familiaDe(p)||"", m=ORDEN_AGOSTO[f]||{};
 const c=claveOrdenCodigo(p.codigo||p.referencia||p.ref||"");
 const k=c||"N:"+claveOrdenNombre(p.nombre||p.descripcion||"");
 return Object.prototype.hasOwnProperty.call(m,k)?m[k]:Number.MAX_SAFE_INTEGER;
}
function compararOrdenInforme(a,b){
 const fa=familiaDe(a)||"", fb=familiaDe(b)||"";
 const ia=ORDEN_FAMILIAS.indexOf(fa), ib=ORDEN_FAMILIAS.indexOf(fb);
 if(ia!==ib) return (ia<0?999:ia)-(ib<0?999:ib);
 const pa=posicionAgostoInforme(a), pb=posicionAgostoInforme(b);
 if(pa!==pb) return pa-pb;
 return String(a.nombre||"").localeCompare(String(b.nombre||""),"es",{numeric:true,sensitivity:"base"});
}

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


        const stock=num(p.stock);

        const precio=precioDe(p);

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
 return (f?productos.filter(p=>familiaDe(p)===f):[...productos]).sort(compararOrdenInforme);
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

 const filas=seleccion.map(p=>({
   Referencia:p.codigo||"",
   Producto:p.nombre||"",
   Familia:familiaDe(p)||"",
   "Proveedor / Ubicación":p.proveedor||p.ubicacion||"",
   Formato:p.formato||"",
   Stock:Number(p.stock)||0,
   Precio:precioDe(p),
   Valor:num(p.stock)*precioDe(p)
 }));

 const totalPrecio=seleccion.reduce((s,p)=>s+precioDe(p),0);
 const totalValor=seleccion.reduce((s,p)=>s+(num(p.stock)*precioDe(p)),0);

 filas.unshift({});
 filas.unshift({
   Producto:"TOTAL VALOR STOCK (STOCK × PRECIO)",
   Valor:totalValor
 });
 filas.unshift({
   Producto:"TOTAL SUMA DE PRECIOS",
   Precio:totalPrecio
 });

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

 const totalPrecio=seleccion.reduce((s,p)=>s+precioDe(p),0);
 const totalValor=seleccion.reduce((s,p)=>s+(num(p.stock)*precioDe(p)),0);

 const {jsPDF}=window.jspdf;
 const pdf=new jsPDF({orientation:"landscape"});

 pdf.text(`Inventario Pro - ${document.getElementById("familiaExportar")?.value || "Todas las familias"}`,15,15);
 pdf.setFont(undefined,"bold");
 pdf.text("TOTAL SUMA DE PRECIOS: "+totalPrecio.toLocaleString("es-ES",{style:"currency",currency:"EUR"}),15,25);
 pdf.text("TOTAL VALOR STOCK (STOCK x PRECIO): "+totalValor.toLocaleString("es-ES",{style:"currency",currency:"EUR"}),15,33);
 pdf.setFont(undefined,"normal");

 pdf.autoTable({
   startY:42,
   head:[["Referencia","Producto","Familia","Proveedor / Ubicación","Formato","Stock","Precio","Valor"]],
   body:seleccion.map(p=>[
     p.codigo||"",p.nombre||"",familiaDe(p)||"",p.proveedor||p.ubicacion||"",p.formato||"",
     num(p.stock),
     precioDe(p).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})+" €",
     (num(p.stock)*precioDe(p)).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})+" €"
   ])
 });


 pdf.save(nombreExportacion("Informe_Inventario")+".pdf");
});


cargarDatos();