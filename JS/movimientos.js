import {db,collection,getDocs,query,orderBy} from "./firebase.js";
let movimientos=[];
const buscar=document.getElementById("buscar");
const tabla=document.getElementById("tablaTrazabilidad");
const detalle=document.getElementById("listaMovimientos");
const norm=v=>String(v||"").trim().toLowerCase();

function fecha(f){try{return (f?.toDate?f.toDate():new Date(f)).toLocaleString("es-ES")}catch{return""}}

function codigoDe(e){return e.codigo||e.referencia||""}
function salidasEntrada(id){
 return movimientos.filter(m=>m.tipo==="Salida"&&m.entradaOrigenId===id)
   .reduce((s,m)=>s+Number(m.cantidad||0),0);
}
function coincide(m,q){
 if(!q)return true;
 return [m.codigo,m.referencia,m.producto,m.pcn,m.pvn].some(v=>norm(v).includes(q));
}
function pintar(){
 const q=norm(buscar.value);
 const entradas=movimientos.filter(m=>m.tipo==="Entrada"&&(m.pcn||m.pvn)&&coincide(m,q));

 if(!entradas.length){
   tabla.innerHTML='<tr><td colspan="8">No hay entradas que coincidan.</td></tr>';
 }else{
   tabla.innerHTML=entradas.map(e=>{
     const pedido=Number(e.cantidadPedida||0);
     const recibido=Number(e.cantidad||0);
     const salidas=salidasEntrada(e.id);
     const disponible=Math.max(recibido-salidas,0);
     const estado=disponible<=0?"Agotada":salidas>0?"Parcial":"Disponible";
     return `<tr>
       <td><strong>${codigoDe(e)}</strong></td>
       <td><strong>${e.pcn||""}</strong></td>
       <td><strong>${e.pvn||""}</strong></td>
       <td>${pedido}</td><td>${recibido}</td><td>${salidas}</td>
       <td><strong>${disponible}</strong></td><td>${estado}</td>
     </tr>`;
   }).join("");
 }

 const ids=new Set(entradas.map(e=>e.id));
 const claves=new Set(entradas.map(e=>`${norm(e.pcn)}|${norm(e.pvn)}|${norm(e.codigo)}`));
 const datos=movimientos.filter(m=>{
   if(m.tipo==="Entrada") return ids.has(m.id);
   if(m.tipo==="Salida"&&m.entradaOrigenId) return ids.has(m.entradaOrigenId);
   return q&&coincide(m,q);
 }).sort((a,b)=>(b.fecha?.seconds||0)-(a.fecha?.seconds||0));

 detalle.innerHTML=datos.length?`<table class="tabla-productos"><thead><tr><th>Fecha</th><th>Tipo</th><th>Código</th><th>PCN</th><th>PVN</th><th>Producto</th><th>Cantidad</th><th>Stock final</th></tr></thead><tbody>${
 datos.map(m=>`<tr><td>${fecha(m.fecha)}</td><td>${m.tipo||""}</td><td>${m.codigo||m.referencia||""}</td><td>${m.pcn||""}</td><td>${m.pvn||""}</td><td>${m.producto||""}</td><td>${Number(m.cantidad||0)}</td><td>${m.stockFinal??""}</td></tr>`).join("")
 }</tbody></table>`:'No hay movimientos para mostrar.';
}
async function cargar(){
 try{
   const datos=await getDocs(query(collection(db,"movimientos"),orderBy("fecha","desc")));
   movimientos=datos.docs.map(d=>({id:d.id,...d.data()}));
   pintar();
 }catch(error){
   console.error(error);
   tabla.innerHTML='<tr><td colspan="8">Error cargando trazabilidad.</td></tr>';
 }
}
buscar.addEventListener("input",pintar);
cargar();