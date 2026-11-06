import {db,collection,getDocs,doc,setDoc,updateDoc,serverTimestamp} from "./firebase.js";
import {FAMILIAS,normalizarFamilia,familiaDe} from "./familias.js";
const F=FAMILIAS;
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
 revs=rs.docs.map(d=>({id:d.id,...d.data()})).filter(r=>{
   // Solo revisiones creadas por la pantalla actual y pertenecientes
   // a las cuatro familias válidas del inventario.
   if(r.mes!==mes.value) return false;
   r.familia=normalizarFamilia(r.familia);
   if(!F.includes(r.familia)) return false;
   if(familia.value && r.familia!==familia.value) return false;

   // Las revisiones actuales guardan productoId. Los registros antiguos
   // que provocaban los 81 falsos revisados no se usan en el cierre.
   if(!r.productoId || !productos.has(r.productoId)) return false;
   return true;
  });
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
// Auditoría previa: nunca se sobrescriben existencias desde un cierre histórico.
function filasAuditoria(){
 return revs.filter(r=>r.revisado).map(r=>{
  const p=productos.get(r.productoId);
  const fisico=r.stockFisico===""||r.stockFisico===null||r.stockFisico===undefined?NaN:Number(r.stockFisico);
  const actual=p?Number(p.stock):NaN;
  const anterior=Number(r.stockSistema);
  let estado="LISTO";
  if(!p) estado="PRODUCTO NO ENCONTRADO";
  else if(!Number.isFinite(fisico)||fisico<0) estado="RECUENTO NO VÁLIDO";
  else if(!Number.isFinite(actual)) estado="STOCK ACTUAL NO VÁLIDO";
  else if(actual===fisico) estado="YA COINCIDE";
  else if(actual!==anterior) estado="CAMBIÓ DESDE EL RECUENTO";
  return {r,p,fisico,actual,anterior,estado};
 });
}
function descargarAuditoria(filas){
 const cols=["Mes","Familia","ID producto","Referencia","Producto","Stock al revisar","Stock físico","Stock actual","Estado"];
 const escCsv=v=>'"'+String(v??"").replaceAll('"','""')+'"';
 const rows=filas.map(({r,p,fisico,actual,anterior,estado})=>[r.mes,r.familia,r.productoId,r.codigo,r.nombreProducto,anterior,Number.isFinite(fisico)?fisico:"",Number.isFinite(actual)?actual:"",estado]);
 const csv='\uFEFF'+[cols,...rows].map(row=>row.map(escCsv).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=`auditoria_inventario_${mes.value}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.getElementById("aplicar").onclick=async()=>{
 try{
  await cargar(); // Obtener los stocks actuales antes de comparar.
  const filas=filasAuditoria();
  if(!filas.length)return alert("No hay recuentos revisados para auditar.");
  descargarAuditoria(filas);
  const conteo=estado=>filas.filter(f=>f.estado===estado).length;
  const resumen=`Auditoría descargada (${filas.length} revisiones).\nYa coincide: ${conteo("YA COINCIDE")}\nCambió desde el recuento: ${conteo("CAMBIÓ DESDE EL RECUENTO")}\nProducto no encontrado: ${conteo("PRODUCTO NO ENCONTRADO")}\nListos para ajustar: ${conteo("LISTO")}.`;
  const cs=await getDocs(collection(db,"cierresInventario"));
  const cerrado=cs.docs.some(d=>d.id===mes.value&&d.data().cerrado);
  if(cerrado)return alert(resumen+"\n\nMES CERRADO: por seguridad NO se ha modificado ningún stock.");
  const listos=filas.filter(f=>f.estado==="LISTO");
  if(!listos.length)return alert(resumen+"\nNo hay productos seguros para actualizar.");
  if(!confirm(resumen+`\n\n¿Aplicar SOLO los ${listos.length} ajustes sin conflictos del mes abierto? Los demás no se modificarán.`))return;
  let correctos=0;const errores=[];
  for(const f of listos){
   try{
    // Volver a leer el producto antes de modificarlo; evitar datos obsoletos.
    const {getDoc}=await import('./firebase.js');
    const snap=await getDoc(doc(db,"productos",f.r.productoId));
    if(!snap.exists()||Number(snap.data().stock)!==f.anterior){errores.push(`${f.r.productoId}: stock cambió, omitido`);continue;}
    await updateDoc(doc(db,"productos",f.r.productoId),{stock:f.fisico,stockAnteriorRevision:f.anterior,ultimaRevisionStock:serverTimestamp()});
    correctos++;
   }catch(err){errores.push(`${f.r.productoId}: ${err.message}`);}
  }
  alert(`Actualizados: ${correctos}. Omitidos/errores: ${errores.length}.\n${errores.slice(0,10).join('\n')}`);
  await cargar();
 }catch(err){console.error(err);alert(`No se ha completado la operación: ${err.message}`)}
};

// Conciliación histórica: guarda una foto verificable del cierre SIN escribir en productos.
const btnConciliar=document.getElementById("conciliarHistorico");
const avisoConciliar=document.getElementById("avisoConciliacion");
const fechaConciliacion="2026-10";
function idConciliacion(m,f){return `${m}__${f.replace(/[^a-z0-9]+/gi,"_").toLowerCase()}`;}
async function estadoConciliacion(){
 const visible=mes.value===fechaConciliacion&&!!familia.value;
 btnConciliar.hidden=!visible;
 avisoConciliar.textContent=visible?"Conciliación histórica: guarda las diferencias de octubre; no modifica Productos ni movimientos.":"";
}
mes.addEventListener("change",estadoConciliacion);
familia.addEventListener("change",estadoConciliacion);
btnConciliar.onclick=async()=>{
 try{
  if(mes.value!==fechaConciliacion||!familia.value)return alert("Selecciona octubre de 2026 y una familia concreta.");
  const m=mes.value,f=familia.value;
  await cargar();
  if(mes.value!==m||familia.value!==f)return alert("La selección ha cambiado. Repite la operación.");
  const cierres=await getDocs(collection(db,"cierresInventario"));
  if(!cierres.docs.some(d=>d.id===m&&d.data().cerrado))return alert("El mes no figura cerrado. No se ha guardado nada.");
  const filas=filasAuditoria();
  if(!filas.length)return alert("No hay recuentos revisados para esta familia.");
  const ids=new Set();
  if(filas.some(x=>!x.r.productoId||ids.has(x.r.productoId)||(ids.add(x.r.productoId),false)))return alert("Hay identificadores ausentes o duplicados. No se ha guardado nada.");
  const invalidas=filas.filter(x=>!x.p||!Number.isFinite(x.fisico)||x.fisico<0||!Number.isFinite(x.anterior)||!Number.isFinite(x.actual));
  if(invalidas.length)return alert(`${invalidas.length} registros sin datos válidos. No se ha guardado nada.`);
  const registros=filas.map(({r,anterior,fisico,actual,estado})=>({
   revisionId:r.id,productoId:r.productoId,referencia:r.codigo||"",producto:r.nombreProducto||"",
   stockSistemaOctubre:anterior,stockFisicoOctubre:fisico,diferenciaOctubre:fisico-anterior,
   stockActualAlConciliar:actual,estadoAuditoria:estado,
   situacion:actual===fisico?"COINCIDE_ACTUAL":actual===anterior?"PENDIENTE_DE_JUSTIFICAR":"CAMBIO_POSTERIOR_REVISAR"
  }));
  const diferencias=registros.filter(x=>x.diferenciaOctubre!==0);
  const pendientes=registros.filter(x=>x.situacion!=="COINCIDE_ACTUAL");
  const texto=`Octubre ${m} · ${f}\nRevisados: ${registros.length}\nDiferencias históricas: ${diferencias.length}\nNo coinciden actualmente: ${pendientes.length}\n\nSe guardará la conciliación documental en Firestore. NO se modificará el stock actual, movimientos ni el cierre original.\n\n¿Guardar conciliación?`;
  if(!confirm(texto))return;
  const destino=doc(db,"conciliacionesInventario",idConciliacion(m,f));
  await setDoc(destino,{
   mes:m,familia:f,tipo:"CONCILIACION_HISTORICA",estado:pendientes.length?"CON_INCIDENCIAS":"CONCILIADO",
   fechaRegistro:serverTimestamp(),totalRevisados:registros.length,totalDiferenciasOctubre:diferencias.length,
   totalIncidencias:pendientes.length,nota:"Registro documental; no cambia productos, movimientos ni cierresInventario.",
   registros
  });
  alert(`Conciliación histórica guardada: ${f}.\n${diferencias.length} diferencias de octubre; ${pendientes.length} incidencias para justificar.\nNo se ha modificado ningún stock.`);
 }catch(err){console.error(err);alert("No se pudo guardar la conciliación: "+err.message)}
};
estadoConciliacion();

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