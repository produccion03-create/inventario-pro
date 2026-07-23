import {

    db,
    collection,
    getDocs

} from "./firebase.js";



async function cargarDashboard(){



const productos = await getDocs(

    collection(db,"productos")

);




let totalProductos = 0;

let valorAlmacen = 0;

let stockBajo = 0;

let sinStock = 0;



let listaStockBajo = "";



let categorias = {};





productos.forEach((documento)=>{



const p = documento.data();



const stock = Number(p.stock) || 0;

const precio = Number(p.precio) || 0;



totalProductos++;



valorAlmacen += stock * precio;





if(stock < 5){


stockBajo++;



listaStockBajo += `


<div class="alerta-stock">


<h3>
⚠️ ${p.nombre}
</h3>


<p>
📦 Stock:
<strong>${stock}</strong>
</p>


<p>
📂 Categoría:
${p.categoria || "Sin categoría"}
</p>


<span>
🔄 Necesita reposición
</span>


</div>


`;



}





if(stock === 0){


sinStock++;


}







let categoria = 
p.categoria || "Sin categoría";



if(!categorias[categoria]){


categorias[categoria]={

cantidad:0,

valor:0

};


}




categorias[categoria].cantidad += stock;



categorias[categoria].valor += stock * precio;



});







document.getElementById("totalProductos").textContent =
totalProductos;



document.getElementById("valorAlmacen").textContent =
valorAlmacen.toFixed(2)+" €";



document.getElementById("stockBajo").textContent =
stockBajo;



document.getElementById("sinStock").textContent =
sinStock;





document.getElementById("listaStockBajo").innerHTML =

listaStockBajo ||

"✅ No hay productos con stock bajo";






mostrarCategorias(categorias);



crearGrafico(

totalProductos,

stockBajo,

sinStock

);



}







function mostrarCategorias(categorias){



let lista = "";



Object.keys(categorias).forEach((cat)=>{



lista += `


<div class="movimiento">


<h3>
📂 ${cat}
</h3>



<p>

📦 Stock total:

<strong>
${categorias[cat].cantidad}
</strong>

</p>



<p>

💰 Valor:

<strong>
${categorias[cat].valor.toFixed(2)} €

</strong>

</p>


</div>


`;



});





document.getElementById("listaCategorias").innerHTML =

lista ||

"No hay categorías registradas";



}







function crearGrafico(productos,bajo,sinStock){



const ctx =
document.getElementById("graficoInventario");



new Chart(ctx,{



type:"doughnut",



data:{



labels:[

"Productos",

"Stock bajo",

"Sin stock"

],



datasets:[{

data:[

productos,

bajo,

sinStock

],



borderWidth:2


}]



},



options:{



responsive:true,



maintainAspectRatio:false,



plugins:{



legend:{


position:"bottom"


}



}



}



});



}





cargarDashboard();