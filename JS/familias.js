export const FAMILIAS = [
  "Stock de planchas",
  "Envases y embalaje",
  "Materias primas auxiliares",
  "Stock de productos terminados"
];

const limpio = v => String(v ?? "").trim().toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function normalizarFamilia(valor){
  const v=limpio(valor);
  if(!v) return "";
  if(v==="stock de planchas" || v==="planchas de eva" || v==="plancha de eva" || v==="planchas eva" || v==="stock planchas" || v==="tacos y planchas" || v==="tacos" || v==="planchas") return FAMILIAS[0];
  if(v==="envases y embalaje" || v==="envases y embalajes" || v==="stock envases embalajes" || v==="stock envases y embalajes" || v==="stock envases y embalaje" || v==="envases embalajes") return FAMILIAS[1];
  if(v==="materias primas auxiliares" || v==="materia prima auxiliar" || v==="materias primas" || v==="stock materias primas auxiliares") return FAMILIAS[2];
  if(v==="stock de productos terminados" || v==="stock productos terminados" || v==="producto terminado" || v==="productos terminados" || v==="producto terminados") return FAMILIAS[3];
  return String(valor??"").trim();
}

export function familiaDe(producto){
  return normalizarFamilia(producto?.familia || producto?.categoria || "");
}
