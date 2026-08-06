/* ==========================================================
   DATOS DE LA RIFA — cambia aquí los valores si lo necesitas
   ========================================================== */
const PRECIO_BOLETO = 10000;   // valor de cada número
/* ========================================================== */

const STORAGE_KEY = 'rifa100_boletos';

let boletos = {};
let numeroActivo = null;

function cargarDatos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  boletos = raw ? JSON.parse(raw) : {};
}

function guardarBoletos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boletos));
}

function formatoDinero(valor) {
  return '$' + Number(valor || 0).toLocaleString('es-CO');
}

function formatoNumero(num) {
  return String(num).padStart(2, '0');
}

function mostrarToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 2200);
}

/* ---------- RENDER ---------- */

function renderGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  let vendidos = 0, recaudado = 0, pendientes = 0;

  for (let i = 0; i <= 99; i++) {
    const b = boletos[i];
    const btn = document.createElement('button');
    btn.className = 'numero';
    const etiqueta = document.createElement('span');
    etiqueta.className = 'numero-txt';
    etiqueta.textContent = formatoNumero(i);
    btn.appendChild(etiqueta);

    if (b) {
      vendidos++;
      if (b.pagado) {
        btn.classList.add('vendido');
        recaudado += PRECIO_BOLETO;
      } else {
        btn.classList.add('pendiente');
        pendientes++;
      }
    }

    btn.addEventListener('click', () => abrirModalNumero(i));
    grid.appendChild(btn);
  }

  const disponibles = 100 - vendidos;
  document.getElementById('statVendidos').textContent = vendidos;
  document.getElementById('statDisponibles').textContent = disponibles;
  document.getElementById('statPendientes').textContent = pendientes;
  document.getElementById('statRecaudado').textContent = formatoDinero(recaudado);
  document.getElementById('badgeDisponibles').textContent = disponibles;
}

/* ---------- MODAL VENTA / VER ---------- */

function abrirModalNumero(num) {
  numeroActivo = num;
  document.getElementById('modalNumero').textContent = formatoNumero(num);
  const b = boletos[num];

  const venderForm = document.getElementById('modalVenderForm');
  const verForm = document.getElementById('modalVerForm');
  document.getElementById('errorMsg').classList.add('hidden');

  if (b) {
    venderForm.classList.add('hidden');
    verForm.classList.remove('hidden');
    document.getElementById('verNombre').value = b.nombre;
    document.getElementById('verTelefono').value = b.telefono;
    document.getElementById('verPagado').checked = !!b.pagado;
    setModoSoloLectura();
  } else {
    verForm.classList.add('hidden');
    venderForm.classList.remove('hidden');
    document.getElementById('inputNombre').value = '';
    document.getElementById('inputTelefono').value = '';
    document.getElementById('inputPagado').checked = false;
  }

  document.getElementById('modalOverlay').classList.remove('hidden');
}

function cerrarModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  numeroActivo = null;
}

function setModoSoloLectura() {
  document.getElementById('verNombre').disabled = true;
  document.getElementById('verTelefono').disabled = true;
  document.getElementById('verPagado').disabled = true;
  document.getElementById('btnEditar').classList.remove('hidden');
  document.getElementById('btnGuardarEdicion').classList.add('hidden');
}

function setModoEdicion() {
  document.getElementById('verNombre').disabled = false;
  document.getElementById('verTelefono').disabled = false;
  document.getElementById('verPagado').disabled = false;
  document.getElementById('btnEditar').classList.add('hidden');
  document.getElementById('btnGuardarEdicion').classList.remove('hidden');
}

function guardarVenta() {
  const nombre = document.getElementById('inputNombre').value.trim();
  const telefono = document.getElementById('inputTelefono').value.trim();
  if (!nombre || !telefono) {
    document.getElementById('errorMsg').classList.remove('hidden');
    return;
  }
  boletos[numeroActivo] = {
    nombre,
    telefono,
    pagado: document.getElementById('inputPagado').checked
  };
  guardarBoletos();
  renderGrid();
  const num = formatoNumero(numeroActivo);
  cerrarModal();
  mostrarToast(`✅ Número ${num} vendido con éxito`);
}

function guardarEdicion() {
  const nombre = document.getElementById('verNombre').value.trim();
  const telefono = document.getElementById('verTelefono').value.trim();
  if (!nombre || !telefono) {
    mostrarToast('⚠️ Nombre y teléfono no pueden estar vacíos');
    return;
  }
  boletos[numeroActivo] = {
    nombre,
    telefono,
    pagado: document.getElementById('verPagado').checked
  };
  guardarBoletos();
  renderGrid();
  setModoSoloLectura();
  mostrarToast(`💾 Número ${formatoNumero(numeroActivo)} actualizado`);
}

function liberarNumero() {
  if (!confirm(`¿Seguro que deseas liberar el número ${formatoNumero(numeroActivo)}? Esto borrará los datos del comprador.`)) return;
  delete boletos[numeroActivo];
  guardarBoletos();
  renderGrid();
  const num = formatoNumero(numeroActivo);
  cerrarModal();
  mostrarToast(`🚫 Número ${num} liberado`);
}

/* ---------- SORTEO ---------- */

function buscarGanador() {
  const valor = document.getElementById('inputGanador').value.trim();
  const num = Number(valor);
  const error = document.getElementById('errorSorteo');
  const resultado = document.getElementById('sorteoResultado');

  if (valor === '' || !Number.isInteger(num) || num < 0 || num > 99) {
    error.classList.remove('hidden');
    resultado.classList.add('hidden');
    return;
  }
  error.classList.add('hidden');

  const datos = boletos[num];
  document.getElementById('numeroGanador').textContent = formatoNumero(num);

  const bloqueDatos = document.getElementById('ganadorDatos');
  const noVendido = document.getElementById('ganadorNoVendido');
  const label = document.getElementById('ganadorLabel');

  if (datos) {
    label.textContent = '🎉 ¡Tenemos Ganador!';
    bloqueDatos.classList.remove('hidden');
    noVendido.classList.add('hidden');
    document.getElementById('ganadorNombre').textContent = datos.nombre;
    document.getElementById('ganadorTelefono').textContent = '📞 ' + datos.telefono;
  } else {
    label.textContent = 'Número no vendido';
    bloqueDatos.classList.add('hidden');
    noVendido.classList.remove('hidden');
    document.getElementById('ganadorNombre').textContent = '';
    document.getElementById('ganadorTelefono').textContent = '';
  }

  resultado.classList.remove('hidden');
  resultado.style.animation = 'none';
  requestAnimationFrame(() => { resultado.style.animation = ''; });
}

/* ---------- GESTIÓN DE DATOS ---------- */

function exportarCSV() {
  const filas = [['Número', 'Nombre', 'Teléfono', 'Pagado']];
  for (let i = 0; i <= 99; i++) {
    const b = boletos[i];
    if (b) filas.push([formatoNumero(i), b.nombre, b.telefono, b.pagado ? 'Sí' : 'No']);
  }
  if (filas.length === 1) {
    mostrarToast('⚠️ No hay compradores para exportar');
    return;
  }
  const csv = filas.map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'compradores_rifa.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const NOMBRES_PRUEBA = [
  'Juan Pérez', 'María González', 'Carlos Rodríguez', 'Ana Martínez', 'Luis Hernández',
  'Laura Gómez', 'Diego López', 'Camila Díaz', 'Andrés Torres', 'Valentina Ramírez',
  'Sebastián Flórez', 'Sofía Vargas', 'Miguel Castro', 'Daniela Ortiz', 'Jorge Ruiz',
  'Paula Morales', 'Felipe Suárez', 'Isabella Rojas', 'Santiago Mora', 'Mariana Jiménez',
  'Alejandro Vega', 'Natalia Castillo', 'Ricardo Peña', 'Carolina Guerrero', 'David Medina',
  'Gabriela Cortés', 'Fernando Reyes', 'Alejandra Silva', 'Óscar Navarro', 'Juliana Aguilar',
  'Iván Contreras', 'Manuela Cárdenas', 'Tomás Salazar', 'Verónica Herrera', 'Nicolás Escobar',
  'Estefanía Duarte', 'Julián Vanegas', 'Ximena Restrepo', 'Emilio Bustos', 'Adriana Palacios'
];

function generarTelefonoPrueba() {
  return '3' + Math.floor(100000000 + Math.random() * 899999999).toString().slice(0, 9);
}

function cargarDatosPrueba() {
  if (!confirm('Esto cargará 83 boletos de prueba con datos aleatorios. ¿Continuar?')) return;

  const disponibles = [];
  for (let i = 0; i <= 99; i++) {
    if (!boletos[i]) disponibles.push(i);
  }

  for (let j = 0; j < disponibles.length; j++) {
    const k = Math.floor(Math.random() * disponibles.length);
    [disponibles[j], disponibles[k]] = [disponibles[k], disponibles[j]];
  }

  const cantidad = Math.min(83, disponibles.length);
  disponibles.slice(0, cantidad).forEach((num, idx) => {
    boletos[num] = {
      nombre: NOMBRES_PRUEBA[idx % NOMBRES_PRUEBA.length],
      telefono: generarTelefonoPrueba(),
      pagado: Math.random() < 0.7
    };
  });

  guardarBoletos();
  renderGrid();
  mostrarToast(`🧪 ${cantidad} boletos de prueba cargados`);
}

function reiniciarRifa() {
  if (!confirm('⚠️ Esto borrará TODOS los boletos vendidos y no se puede deshacer. ¿Continuar?')) return;
  if (!confirm('Confirma una vez más: ¿Reiniciar completamente la rifa?')) return;
  boletos = {};
  guardarBoletos();
  renderGrid();
  mostrarToast('🗑️ Rifa reiniciada');
}

/* ---------- TABS ---------- */

function cambiarTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + tab));
}

/* ---------- INIT ---------- */

function init() {
  cargarDatos();
  renderGrid();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => cambiarTab(btn.dataset.tab));
  });

  document.getElementById('modalClose').addEventListener('click', cerrarModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') cerrarModal();
  });
  document.getElementById('btnGuardarVenta').addEventListener('click', guardarVenta);
  document.getElementById('btnEditar').addEventListener('click', setModoEdicion);
  document.getElementById('btnGuardarEdicion').addEventListener('click', guardarEdicion);
  document.getElementById('btnLiberar').addEventListener('click', liberarNumero);

  document.getElementById('btnBuscarGanador').addEventListener('click', buscarGanador);
  document.getElementById('inputGanador').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscarGanador();
  });

  document.getElementById('btnExportar').addEventListener('click', exportarCSV);
  document.getElementById('btnDatosPrueba').addEventListener('click', cargarDatosPrueba);
  document.getElementById('btnReiniciar').addEventListener('click', reiniciarRifa);
}

document.addEventListener('DOMContentLoaded', init);
