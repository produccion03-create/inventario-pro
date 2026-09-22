import {db,collection,getDocs,doc,updateDoc,addDoc,serverTimestamp} from "./firebase.js";

const producto=document.getElementById("producto");
const pcn=document.getElementById("pcn");
const pvn=document.getElementById("pvn");
const cantidadPedida=document.getElementById("cantidadPedida");
const cantidad=document.getElementById("cantidad");
const observaciones=document.getElementById("observaciones");
const boton=document.getElementById("guardarEntrada");
const resumen=document.getElementById("resumenEntrada");
const tabla=document.getElementById("tablaEntradas");

let productos=[],movimientos=[],seleccionado=null;
const norm=v=>String(v||"").trim().toUpperCase();

function entradasMismoPedido(){
 const P=norm(pcn.value),V=norm(pvn.value);
 if(!seleccionado||(!P&&!V)) return [];
 return movimientos.filter(m=>m.tipo==="Entrada" &&
   (m.productoId===seleccionado.id || (m.codigo&&m.codigo===seleccionado.codigo)) &&
   (!P||norm(m.pcn)===P) && (!V||norm(m.pvn)===V));
}
function recibidoAnterior(){return entradasMismoPedido().reduce((s,m)=>s+Number(m.cantidad||0),0)}
function recuperarPedido(){
 const prev=entradasMismoPedido();
 if(prev.length){
   const ped=Number(prev[0].cantidadPedida||0);
   if(ped>0) cantidadPedida.value=ped;
 }
 actualizarResumen();
}
function actualizarResumen(){
 const ped=Number(cantidadPedida.value||0);
 const ant=recibidoAnterior();
 const ahora=Number(cantidad.value||0);
 const total=ant+ahora;
 if(!ped){resumen.textContent=ant?`Recibido anteriormente: ${ant}`:"";return}
 const pend=ped-total;
 resumen.textContent=pend>0?`Recibido anteriormente: ${ant} · Con esta entrada: ${total} · Pendiente: ${pend}`:
 pend===0?`Pedido completo · Total recibido: ${total}`:`Exceso: ${Math.abs(pend)} · Total recibido: ${total}`;
}
function actualizarProducto(){
 seleccionado=productos.find(x=>x.id===producto.value)||null;
 recuperarPedido();
}
function fecha(m){try{return (m.fecha?.toDate?m.fecha.toDate():new Date(m.fecha)).toLocaleDateString("es-ES")}catch{return""}}
function pintar(){
 const ens=movimientos.filter(m=>m.tipo==="Entrada"&&(m.pcn||m.pvn)).sort((a,b)=>(b.fecha?.seconds||0)-(a.fecha?.seconds||0));
 tabla.innerHTML=ens.length?ens.map(m=>{
   const ped=Number(m.cantidadPedida||0),rec=Number(m.recibidoAcumulado||m.cantidad||0),pen=Math.max(ped-rec,0);
   const est=ped?rec<ped?"Parcial":rec===ped?"Completo":"Exceso":"";
   return `<tr><td style="padding:9px;border-bottom:1px solid #eee">${fecha(m)}</td><td style="padding:9px;border-bottom:1px solid #eee"><b>${m.pcn||""}</b></td><td style="padding:9px;border-bottom:1px solid #eee"><b>${m.pvn||""}</b></td><td style="padding:9px;border-bottom:1px solid #eee">${m.codigo||m.referencia||m.producto||""}</td><td style="padding:9px;border-bottom:1px solid #eee;text-align:right">${ped}</td><td style="padding:9px;border-bottom:1px solid #eee;text-align:right">${rec}</td><td style="padding:9px;border-bottom:1px solid #eee;text-align:right">${pen}</td><td style="padding:9px;border-bottom:1px solid #eee">${est}</td></tr>`;
 }).join(""):'<tr><td colspan="8" style="padding:14px">Todavía no hay entradas.</td></tr>';
}
async function cargar(){
 const[ps,ms]=await Promise.all([getDocs(collection(db,"productos")),getDocs(collection(db,"movimientos"))]);
 productos=ps.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.nombre||"").localeCompare(String(b.nombre||"")));
 movimientos=ms.docs.map(d=>({id:d.id,...d.data()}));
 producto.innerHTML="";
 productos.forEach(x=>{const codigo=x.codigo||x.referencia||x.nombre||"";producto.add(new Option(`${codigo} · Stock ${Number(x.stock||0)}`,x.id));});
 actualizarProducto();pintar();
}
producto.onchange=actualizarProducto;
pcn.oninput=recuperarPedido;pvn.oninput=recuperarPedido;
cantidadPedida.oninput=actualizarResumen;cantidad.oninput=actualizarResumen;

boton.onclick=async()=>{
 actualizarProducto();
 const P=norm(pcn.value),V=norm(pvn.value),ped=Number(cantidadPedida.value),rec=Number(cantidad.value);
 if(!seleccionado)return alert("Selecciona un producto");
 if(!P)return alert("Introduce el PCN");
 if(!V)return alert("Introduce el PVN");
 if(!(ped>0))return alert("Introduce la cantidad pedida");
 if(!(rec>0))return alert("Introduce la cantidad recibida");
 const ant=recibidoAnterior(),acu=ant+rec,pend=Math.max(ped-acu,0),dif=acu-ped;
 const estado=acu<ped?"Parcial":acu===ped?"Completo":"Exceso";
 const stockAnterior=Number(seleccionado.stock||0),stockFinal=stockAnterior+rec;
 await updateDoc(doc(db,"productos",seleccionado.id),{stock:stockFinal});
 await addDoc(collection(db,"movimientos"),{tipo:"Entrada",productoId:seleccionado.id,codigo:seleccionado.codigo||"",producto:seleccionado.nombre||"",categoria:seleccionado.categoria||seleccionado.familia||"",pcn:P,pvn:V,cantidadPedida:ped,cantidad:rec,recibidoAnterior:ant,recibidoAcumulado:acu,pendiente:pend,diferencia:dif,estadoPedido:estado,stockAnterior,stockFinal,observaciones:observaciones.value.trim(),fecha:serverTimestamp()});
 alert(`✅ Entrada registrada · Pendiente: ${pend}`);
 location.reload();
};
cargar();