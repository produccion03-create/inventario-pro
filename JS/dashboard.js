import {db,collection,getDocs} from "./firebase.js";

const num=v=>Number(v)||0;
const norm=v=>String(v||"").trim().toUpperCase();

async function cargarDashboard(){
 const [ps,ms]=await Promise.all([
   getDocs(collection(db,"productos")),
   getDocs(collection(db,"movimientos"))
 ]);
 const productos=ps.docs.map(d=>({id:d.id,...d.data()}));
 const movimientos=ms.docs.map(d=>({id:d.id,...d.data()}));

 const totalProductos=productos.length;
 const valorAlmacen=productos.reduce((s,p)=>s+num(p.stock)*num(p.precio),0);

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

 document.getElementById("tablaPendientes").innerHTML=pendientes.length?pendientes.map(p=>`<tr><td><b>${p.codigo}</b></td><td>${p.pcn}</td><td>${p.pvn}</td><td>${p.pedido}</td><td>${p.recibido}</td><td><b>${p.pendiente}</b></td></tr>`).join(""):'<tr><td colspan="6">✅ No hay pedidos pendientes.</td></tr>';

 document.getElementById("tablaDisponibles").innerHTML=disponibles.length?disponibles.map(x=>`<tr><td><b>${x.codigo}</b></td><td>${x.pcn}</td><td>${x.pvn}</td><td>${x.entro}</td><td>${x.salio}</td><td><b>${x.disponible}</b></td></tr>`).join(""):'<tr><td colspan="6">No hay material disponible de entradas.</td></tr>';
}
cargarDashboard().catch(e=>{console.error(e);alert("Error al cargar el Dashboard");});