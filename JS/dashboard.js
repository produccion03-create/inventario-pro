import {db,collection,getDocs} from "./firebase.js";

const num=v=>{
 const n=Number(String(v ?? "").trim().replace(",","."));
 return Number.isFinite(n)?n:0;
};
const precioDe=p=>num(
 p.precio ??
 p.precioUnitario ??
 p.precio_unitario ??
 p.precioUnidad ??
 p.coste ??
 p.costo ??
 p.valorUnitario ??
 p.valor_unitario ??
 0
);
const norm=v=>String(v||"").trim().toUpperCase();

async function cargarDashboard(){
 const [ps,ms]=await Promise.all([
   getDocs(collection(db,"productos")),
   getDocs(collection(db,"movimientos"))
 ]);
 const productos=ps.docs.map(d=>({id:d.id,...d.data()}));
 const movimientos=ms.docs.map(d=>({id:d.id,...d.data()}));

 const totalProductos=productos.length;
 const valorAlmacen=productos.reduce((s,p)=>s+num(p.stock)*precioDe(p),0);

 const stockBajo=productos.filter(p=>{
   const stock=num(p.stock), minimo=num(p.stockMinimo ?? 5);
   return p.categoria!=="Planchas de EVA" && stock>0 && stock<=minimo;
 }).length;
 const sinStock=productos.filter(p=>num(p.stock)===0).length;
 const stockCorrecto=Math.max(totalProductos-stockBajo-sinStock,0);



 const categorias={};
 const familiaCorrecta=p=>{
   const raw=String(p.familia||p.categoria||"").trim().toLowerCase();
   if(raw.includes("plancha")||raw.includes("eva")||raw.includes("taco")) return "Stock de planchas";
   if(raw.includes("envase")||raw.includes("embalaje")) return "Envases y embalaje";
   if(raw.includes("materia")||raw.includes("auxiliar")) return "Materias primas auxiliares";
   if(raw.includes("producto terminado")||raw.includes("productos terminados")) return "Stock de productos terminados";
   return p.familia||p.categoria||"Sin categoría";
 };
 // Evitar sumar registros antiguos cuando ya existe el registro válido
 // importado con su familia canónica.
 const canonicas=[
   "Stock de planchas",
   "Envases y embalaje",
   "Materias primas auxiliares",
   "Stock de productos terminados"
 ];
 const limpio=s=>String(s??"").trim().toLowerCase()
   .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
   .replace(/[^a-z0-9]/g,"");
 const esCanonico=p=>canonicas.includes(String(p.familia||"").trim());
 const claveProducto=p=>{
   const codigo=limpio(p.codigo||p.referencia||p.ref||"");
   if(codigo) return "c:"+codigo;
   const nombre=limpio(p.nombre||p.descripcion||"");
   if(nombre) return "n:"+nombre;
   return "f:"+limpio((p.origenExcel||"")+"|"+(p.excelFila||""));
 };

 const esAgosto=p=>{
   const o=String(p.origenExcel||p.origen||p.importacion||"").toUpperCase();
   return o.includes("AGOSTO_2026") || o.includes("AGOSTO 2026");
 };

 // Para las cuatro familias del cierre, si existen registros de la
 // importación AGOSTO 2026, esos son la única fuente válida.
 const agosto=productos.filter(p=>esAgosto(p) && esCanonico(p));
 const familiasAgosto=new Set(agosto.map(p=>familiaCorrecta(p)));

 const depurados=productos.filter(p=>{
   const fam=familiaCorrecta(p);
   if(familiasAgosto.has(fam)) return esAgosto(p) && esCanonico(p);
   return true;
 });

 depurados.forEach(p=>{
   const cat=familiaCorrecta(p);
   if(!categorias[cat]) categorias[cat]={productos:0,stock:0,valor:0};
   categorias[cat].productos++;
   categorias[cat].stock+=num(p.stock);
   categorias[cat].valor+=num(p.stock)*precioDe(p);
 });

 const entradas=movimientos.filter(m=>m.tipo==="Entrada"&&(m.pcn||m.pvn));
 const salidas=movimientos.filter(m=>m.tipo==="Salida");

 const salidaEntrada=id=>salidas.filter(s=>s.entradaOrigenId===id).reduce((a,s)=>a+num(s.cantidad),0);

 // Group order receipts by product + PCN + PVN to avoid counting the same ordered qty several times.
 const pedidos={};
 entradas.forEach(e=>{
   const k=`${e.productoId||e.codigo}|${norm(e.pcn)}|${norm(e.pvn)}`;
   if(!pedidos[k]) pedidos[k]={codigo:e.codigo||e.referencia||"",pcn:e.pcn||"",pvn:e.pvn||"",pedido:num(e.cantidadPedida),recibido:0};
   pedidos[k].pedido=Math.max(pedidos[k].pedido,num(e.cantidadPedida));
   pedidos[k].recibido+=num(e.cantidad);
 });
 const listaPedidos=Object.values(pedidos).map(p=>({...p,pendiente:Math.max(p.pedido-p.recibido,0)}));
 const pendientes=listaPedidos.filter(p=>p.pendiente>0);
 const pendienteRecibir=pendientes.reduce((s,p)=>s+p.pendiente,0);

 const disponibles=entradas.map(e=>{
   const entro=num(e.cantidad),salio=salidaEntrada(e.id);
   return {codigo:e.codigo||e.referencia||"",pcn:e.pcn||"",pvn:e.pvn||"",entro,salio,disponible:Math.max(entro-salio,0)};
 }).filter(x=>x.disponible>0);
 const disponibleEntradas=disponibles.reduce((s,x)=>s+x.disponible,0);

 document.getElementById("totalProductos").textContent=totalProductos;
 document.getElementById("valorAlmacen").textContent=valorAlmacen.toLocaleString("es-ES",{style:"currency",currency:"EUR"});
 document.getElementById("pendienteRecibir").textContent=pendienteRecibir;
 document.getElementById("disponibleEntradas").textContent=disponibleEntradas;



 const listaCategorias=document.getElementById("listaCategorias");
 const catsOrdenadas=Object.entries(categorias).sort((a,b)=>b[1].valor-a[1].valor);
 listaCategorias.innerHTML=catsOrdenadas.length
   ? `<table class="tabla-productos"><thead><tr><th>Categoría</th><th>Productos</th><th>Stock</th><th>Valor</th></tr></thead><tbody>${
       catsOrdenadas.map(([cat,d])=>`<tr><td><strong>${cat}</strong></td><td>${d.productos}</td><td>${d.stock}</td><td><strong>${d.valor.toLocaleString("es-ES",{style:"currency",currency:"EUR"})}</strong></td></tr>`).join("")
     }</tbody></table>`
   : "No hay categorías.";

 const ctx=document.getElementById("graficoCategorias");
 if(ctx && window.Chart){
   const datosCategorias=Object.entries(categorias).sort((a,b)=>b[1].valor-a[1].valor);
   new Chart(ctx,{
     type:"bar",
     data:{
       labels:datosCategorias.map(([cat])=>cat),
       datasets:[{label:"Valor €",data:datosCategorias.map(([,d])=>d.valor)}]
     },
     options:{
       responsive:true,
       maintainAspectRatio:false,
       plugins:{legend:{display:false}},
       scales:{y:{beginAtZero:true}}
     }
   });
 }

 document.getElementById("tablaPendientes").innerHTML=pendientes.length?pendientes.map(p=>`<tr><td><b>${p.codigo}</b></td><td>${p.pcn}</td><td>${p.pvn}</td><td>${p.pedido}</td><td>${p.recibido}</td><td><b>${p.pendiente}</b></td></tr>`).join(""):'<tr><td colspan="6">✅ No hay pedidos pendientes.</td></tr>';

 document.getElementById("tablaDisponibles").innerHTML=disponibles.length?disponibles.map(x=>`<tr><td><b>${x.codigo}</b></td><td>${x.pcn}</td><td>${x.pvn}</td><td>${x.entro}</td><td>${x.salio}</td><td><b>${x.disponible}</b></td></tr>`).join(""):'<tr><td colspan="6">No hay material disponible de entradas.</td></tr>';
}
cargarDashboard().catch(e=>{console.error(e);alert("Error al cargar el Dashboard");});