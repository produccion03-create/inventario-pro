import {db,collection,getDocs,doc,setDoc,serverTimestamp} from "./firebase.js";
const FAMILIAS=["Stock de planchas","Envases y embalaje","Materias primas auxiliares","Stock de productos terminados"];
const familiaSelect=document.getElementById("familia"),tbody=document.getElementById("tablaRevision"),resumen=document.getElementById("resumen");
let productos=[],revisiones=new Map();
const ahora=new Date(),mesActual=`${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}`;
const t=v=>String(v??"").trim(), n=v=>Number.isFinite(Number(v))?Number(v):0;
function esc(v){return t(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
async function cargarDatos(){
 const [ps,rs]=await Promise.all([getDocs(collection(db,"productos")),getDocs(collection(db,"revisionesStock"))]);
 productos=ps.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.revisionStock===true&&FAMILIAS.includes(p.familia||p.categoria));
 revisiones.clear();rs.forEach(d=>{const r=d.data();if(r.mes===mesActual&&r.productoId)revisiones.set(r.productoId,r)});
 familiaSelect.innerHTML='<option value="">Selecciona una familia...</option>';
 FAMILIAS.forEach(f=>{const c=productos.filter(p=>(p.familia||p.categoria)===f).length;if(c){const o=document.createElement("option");o.value=f;o.textContent=`${f} (${c})`;familiaSelect.appendChild(o)}});
 tbody.innerHTML='<tr><td colspan="12">Selecciona una familia para empezar la revisión.</td></tr>';
}
function lista(){return productos.filter(p=>(p.familia||p.categoria)===familiaSelect.value).sort((a,b)=>{const oa=t(a.origenExcel),ob=t(b.origenExcel);return oa!==ob?oa.localeCompare(ob,"es"):n(a.excelFila)-n(b.excelFila)})}
function resumenUI(l){if(!l.length){resumen.innerHTML="";return}const r=l.filter(p=>revisiones.get(p.id)?.revisado).length;resumen.innerHTML=`<span class="chip">Total: ${l.length}</span><span class="chip">Revisados: ${r}</span><span class="chip">Pendientes: ${l.length-r}</span><span class="chip">Mes: ${mesActual}</span>`}
function render(){
 const l=lista();if(!familiaSelect.value){tbody.innerHTML='<tr><td colspan="12">Selecciona una familia.</td></tr>';resumenUI([]);return}
 tbody.innerHTML=l.map(p=>{const r=revisiones.get(p.id),f=r?.stockFisico??"",d=f===""?"":n(f)-n(p.stock),ok=!!r?.revisado;return `<tr data-id="${p.id}" class="${ok?"revisado":""}"><td>${esc(p.codigo)}</td><td>${esc(p.nombre)}</td><td>${esc(p.material||p.subfamilia)}</td><td>${esc(p.descripcion)}</td><td>${esc(p.color)}</td><td>${esc(p.proveedor)}</td><td><strong>${esc(p.formato)}</strong></td><td>${n(p.stock)}</td><td><input class="stock-fisico" type="number" step="any" inputmode="decimal" value="${f}"></td><td class="diferencia">${d===""?"—":d}</td><td><input class="check-revisado" type="checkbox" ${ok?"checked":""}></td><td class="estado">${ok?"✓ Revisado":"Pendiente"}</td></tr>`}).join("");
 resumenUI(l);
}
async function guardar(tr,ok=true){
 const p=productos.find(x=>x.id===tr.dataset.id),input=tr.querySelector(".stock-fisico"),check=tr.querySelector(".check-revisado"),estado=tr.querySelector(".estado"),dif=tr.querySelector(".diferencia");
 if(input.value===""){if(ok){alert("Introduce el stock físico.");check.checked=false;input.focus()}return}
 const fisico=Number(input.value);if(!Number.isFinite(fisico)){alert("Stock físico no válido.");check.checked=false;return}
 tr.classList.add("guardando");estado.textContent="Guardando...";
 const datos={productoId:p.id,codigo:p.codigo||"",nombreProducto:p.nombre||"",familia:p.familia||p.categoria||"",subfamilia:p.subfamilia||"",material:p.material||"",descripcion:p.descripcion||"",formato:p.formato||"",stockSistema:n(p.stock),stockFisico:fisico,diferencia:fisico-n(p.stock),mes:mesActual,revisado:ok,fechaRevision:serverTimestamp()};
 try{await setDoc(doc(db,"revisionesStock",`${mesActual}_${p.id}`),datos,{merge:true});revisiones.set(p.id,{...datos});dif.textContent=datos.diferencia;check.checked=ok;tr.classList.toggle("revisado",ok);estado.textContent=ok?"✓ Revisado":"Pendiente";resumenUI(lista())}catch(e){console.error(e);estado.textContent="Error";alert(`No se pudo guardar: ${e.message}`)}finally{tr.classList.remove("guardando")}
}
familiaSelect.addEventListener("change",render);
tbody.addEventListener("focusin",e=>{const tr=e.target.closest("tr[data-id]");if(tr){tbody.querySelectorAll(".activa").forEach(x=>x.classList.remove("activa"));tr.classList.add("activa")}});
tbody.addEventListener("input",e=>{if(!e.target.classList.contains("stock-fisico"))return;const tr=e.target.closest("tr"),p=productos.find(x=>x.id===tr.dataset.id),c=tr.querySelector(".diferencia");c.textContent=e.target.value===""?"—":Number(e.target.value)-n(p.stock)});
tbody.addEventListener("change",async e=>{const tr=e.target.closest("tr[data-id]");if(tr&&e.target.classList.contains("check-revisado"))await guardar(tr,e.target.checked)});
tbody.addEventListener("keydown",async e=>{if(!e.target.classList.contains("stock-fisico")||e.key!=="Enter")return;e.preventDefault();const tr=e.target.closest("tr[data-id]"),c=tr.querySelector(".check-revisado");c.checked=true;await guardar(tr,true);const sig=tr.nextElementSibling?.querySelector(".stock-fisico");if(sig){sig.focus();sig.select();sig.scrollIntoView({block:"center",behavior:"smooth"})}});
cargarDatos().catch(e=>{console.error(e);tbody.innerHTML=`<tr><td colspan="12">Error: ${esc(e.message)}</td></tr>`});