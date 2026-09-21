import {db,collection,getDocs,doc,setDoc,updateDoc,serverTimestamp} from "./firebase.js";
const F=["Stock de planchas","Envases y embalaje","Materias primas auxiliares","Stock de productos terminados"];
const mes=document.getElementById("mes"),familia=document.getElementById("familia"),tabla=document.getElementById("tabla"),resumen=document.getElementById("resumen"),estado=document.getElementById("estadoCierre");
const hoy=new Date();mes.value=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}`;
F.forEach(x=>familia.insertAdjacentHTML("beforeend",`<option>${x}</option>`));
let productos=new Map(),productosConPrecio=[],revs=[];
const norm=v=>String(v??"").trim().toLowerCase();
function productoParaRevision(r){
 const directo=productos.get(r.productoId);
 if(directo && Number(directo.precioUnitario)>0) return directo;

 const textoRev=norm([r.codigo,r.referencia,r.nombreProducto,r.producto,r.nombre].filter(Boolean).join(" "));
 const tokens=textoRev.replace(/[^a-z0-9áéíóúüñ]+/g," ").split(/\s+/).filter(t=>t.length>=3);
 let mejor=null, mejorPuntos=0;

 for(const p of productosConPrecio){
   if(r.familia && p.familia && norm(r.familia)!==norm(p.familia)) continue;
   const textoP=norm([p.codigo,p.nombre,p.descripcion,p.material,p.subfamilia,p.formato].filter(Boolean).join(" "));
   let puntos=0;
   for(const t of tokens) if(textoP.includes(t)) puntos += t.length;
   if(Number(r.stockSistema)===Number(p.stock)) puntos += 3;
   if(puntos>mejorPuntos){ mejorPuntos=puntos; mejor=p; }
 }
 return mejorPuntos>=5 ? mejor : (directo||{});
}
const e=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
async function cargar(){
 const [ps,rs,cs]=await Promise.all([getDocs(collection(db,"productos")),getDocs(collection(db,"revisionesStock")),getDocs(collection(db,"cierresInventario"))]);
 productos=new Map(ps.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
 productosConPrecio=[...productos.values()].filter(p=>Number(p.precioUnitario)>0);
 revs=rs.docs.map(d=>d.data()).filter(r=>r.mes===mes.value&&(!familia.value||r.familia===familia.value));
 const cierre=cs.docs.map(d=>d.data()).find(c=>c.mes===mes.value);
 estado.innerHTML=cierre?`<div class="chip">🔒 Inventario cerrado: ${e(cierre.mes)}</div>`:"";
 render();
}
function render(){
 const total=revs.length,revisados=revs.filter(r=>r.revisado).length,difs=revs.filter(r=>r.revisado&&Number(r.diferencia)!==0).length;
 const valorFisico=revs.filter(r=>r.revisado).reduce((s,r)=>{const p=productoParaRevision(r);return s+(Number(r.stockFisico)||0)*(Number(p.precioUnitario)||0)},0);
 resumen.innerHTML=`<span class="chip">Revisados: ${revisados}</span><span class="chip">Con diferencias: ${difs}</span><span class="chip">Registros: ${total}</span><span class="chip">Valor stock físico: ${valorFisico.toLocaleString("es-ES",{style:"currency",currency:"EUR"})}</span>`;
 tabla.innerHTML=revs.sort((a,b)=>(a.familia||"").localeCompare(b.familia||"")||(a.codigo||"").localeCompare(b.codigo||"")).map(r=>{const p=productoParaRevision(r);const precio=Number(p.precioUnitario)||0;const valor=(Number(r.stockFisico)||0)*precio;return `<tr><td>${e(r.codigo)}</td><td>${e(r.nombreProducto)}</td><td>${e(r.familia)}</td><td>${Number(r.stockSistema||0)}</td><td>${r.stockFisico??""}</td><td class="dif">${(Number(r.stockFisico||0)-Number(r.stockSistema||0))}</td><td>${precio?precio.toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"—"}</td><td>${precio?valor.toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"—"}</td><td>${r.revisado?"✓ Revisado":"Pendiente"}</td></tr>`}).join("")||'<tr><td colspan="9">No hay revisiones para este mes.</td></tr>';
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

document.getElementById("pdf").onclick=()=>{
 if(!revs.length)return alert("No hay revisiones para generar el informe.");
 const {jsPDF}=window.jspdf;
 const pdf=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
 const revisados=revs.filter(r=>r.revisado);
 const diferencias=revisados.filter(r=>Number(r.diferencia)!==0);
 const valorTotal=revisados.reduce((s,r)=>{const p=productoParaRevision(r);return s+(Number(r.stockFisico)||0)*(Number(p.precioUnitario)||0)},0);
 pdf.setFontSize(18);pdf.text("Inventario Pro - Informe de cierre mensual",14,15);
 pdf.setFontSize(11);pdf.text(`Mes: ${mes.value}`,14,23);pdf.text(`Familia: ${familia.value||"Todas"}`,14,29);
 pdf.text(`Productos revisados: ${revisados.length}`,14,35);pdf.text(`Productos con diferencias: ${diferencias.length}`,14,41);
 pdf.text(`Valor total del stock físico: ${valorTotal.toLocaleString("es-ES",{style:"currency",currency:"EUR"})}`,14,47);
 pdf.text(`Fecha del informe: ${new Date().toLocaleDateString("es-ES")}`,14,53);
 const filas=revs.map(r=>{const p=productoParaRevision(r);const precio=Number(p.precioUnitario)||0;const valor=(Number(r.stockFisico)||0)*precio;return [r.codigo||"",r.nombreProducto||"",r.familia||"",String(Number(r.stockSistema||0)),String(r.stockFisico??""),String((Number(r.stockFisico||0)-Number(r.stockSistema||0))),precio?precio.toFixed(2):"",precio?valor.toFixed(2):"",r.revisado?"Revisado":"Pendiente"]});
 pdf.autoTable({startY:59,head:[["Referencia","Producto","Familia","Stock sistema","Stock físico","Diferencia","Precio €","Valor €","Estado"]],body:filas,styles:{fontSize:6.5,cellPadding:1.4},margin:{left:7,right:7}});
 if(diferencias.length){pdf.addPage("a4","landscape");pdf.setFontSize(16);pdf.text("Diferencias encontradas",14,15);pdf.autoTable({startY:22,head:[["Referencia","Producto","Familia","Stock sistema","Stock físico","Diferencia","Precio €","Valor físico €"]],body:diferencias.map(r=>{const p=productoParaRevision(r);const precio=Number(p.precioUnitario)||0;return [r.codigo||"",r.nombreProducto||"",r.familia||"",String(Number(r.stockSistema||0)),String(r.stockFisico??""),String((Number(r.stockFisico||0)-Number(r.stockSistema||0))),precio?precio.toFixed(2):"",precio?((Number(r.stockFisico)||0)*precio).toFixed(2):""]}),styles:{fontSize:7,cellPadding:1.5},margin:{left:7,right:7}});}
 pdf.save(`inventario_${mes.value}_${(familia.value||"todas").replaceAll(" ","_")}.pdf`);
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