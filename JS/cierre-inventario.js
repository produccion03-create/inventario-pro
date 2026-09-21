import {db,collection,getDocs,doc,setDoc,updateDoc,serverTimestamp} from "./firebase.js";
const F=["Stock de planchas","Envases y embalaje","Materias primas auxiliares","Stock de productos terminados"];
const mes=document.getElementById("mes"),familia=document.getElementById("familia"),tabla=document.getElementById("tabla"),resumen=document.getElementById("resumen"),estado=document.getElementById("estadoCierre");
const hoy=new Date();mes.value=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}`;
F.forEach(x=>familia.insertAdjacentHTML("beforeend",`<option>${x}</option>`));
let productos=new Map(),revs=[];
const e=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
async function cargar(){
 const [ps,rs,cs]=await Promise.all([getDocs(collection(db,"productos")),getDocs(collection(db,"revisionesStock")),getDocs(collection(db,"cierresInventario"))]);
 productos=new Map(ps.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
 revs=rs.docs.map(d=>d.data()).filter(r=>r.mes===mes.value&&(!familia.value||r.familia===familia.value));
 const cierre=cs.docs.map(d=>d.data()).find(c=>c.mes===mes.value);
 estado.innerHTML=cierre?`<div class="chip">🔒 Inventario cerrado: ${e(cierre.mes)}</div>`:"";
 render();
}
function render(){
 const total=revs.length,revisados=revs.filter(r=>r.revisado).length,difs=revs.filter(r=>r.revisado&&Number(r.diferencia)!==0).length;
 resumen.innerHTML=`<span class="chip">Revisados: ${revisados}</span><span class="chip">Con diferencias: ${difs}</span><span class="chip">Registros: ${total}</span>`;
 tabla.innerHTML=revs.sort((a,b)=>(a.familia||"").localeCompare(b.familia||"")||(a.codigo||"").localeCompare(b.codigo||"")).map(r=>`<tr><td>${e(r.codigo)}</td><td>${e(r.nombreProducto)}</td><td>${e(r.familia)}</td><td>${Number(r.stockSistema||0)}</td><td>${r.stockFisico??""}</td><td class="dif">${Number(r.diferencia||0)}</td><td>${r.revisado?"✓ Revisado":"Pendiente"}</td></tr>`).join("")||'<tr><td colspan="7">No hay revisiones para este mes.</td></tr>';
}
document.getElementById("cargar").onclick=cargar;
document.getElementById("aplicar").onclick=async()=>{
 const validas=revs.filter(r=>r.revisado&&r.productoId&&Number.isFinite(Number(r.stockFisico)));
 if(!validas.length)return alert("No hay revisiones válidas para actualizar.");
 if(!confirm(`Se actualizarán ${validas.length} productos con el stock físico. ¿Continuar?`))return;
 for(const r of validas)await updateDoc(doc(db,"productos",r.productoId),{stock:Number(r.stockFisico),stockAnteriorRevision:Number(r.stockSistema||0),ultimaRevisionStock:serverTimestamp()});
 alert("Stock del sistema actualizado.");
 await cargar();
};
document.getElementById("cerrar").onclick=async()=>{
 const pendientes=revs.filter(r=>!r.revisado).length;
 if(pendientes&& !confirm(`Hay ${pendientes} registros pendientes. ¿Cerrar igualmente?`))return;
 if(!confirm(`Vas a cerrar el inventario de ${mes.value}. ¿Confirmas?`))return;
 await setDoc(doc(db,"cierresInventario",mes.value),{mes:mes.value,cerrado:true,totalRevisiones:revs.length,conDiferencias:revs.filter(r=>r.revisado&&Number(r.diferencia)!==0).length,fechaCierre:serverTimestamp()},{merge:true});
 alert("Inventario mensual cerrado.");
 await cargar();
};
cargar().catch(x=>{console.error(x);tabla.innerHTML=`<tr><td colspan="7">Error: ${e(x.message)}</td></tr>`});