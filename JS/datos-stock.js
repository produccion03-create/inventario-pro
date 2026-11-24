export function numero(v){const n=Number(String(v??"").trim().replace(",","."));return Number.isFinite(n)?n:0;}
export function precioDe(p){return numero(p.precio ?? p.precioUnitario ?? p.precio_unitario ?? p.precioUnidad ?? p.coste ?? p.costo ?? p.valorUnitario ?? p.valor_unitario ?? 0);}
export function productoActual(p){return {...p,stock:numero(p.stock),precio:precioDe(p)};}
