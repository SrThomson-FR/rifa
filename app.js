const STORAGE_KEY = 'rifa100_boletos';
const CONFIG_KEY = 'rifa100_config';
const ADMIN_PIN = '2026';

let boletos = {};
let config = { titulo: 'Rifa Solidaria', premio: '🎁 Premio Sorpresa', precio: 10000 };
let isAdmin = false;
let numeroActivo = null;

function cargarDatos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  boletos = raw ? JSON.parse(raw) : {};
  const rawConfig = localStorage.getItem(CONFIG_KEY);
  if (rawConfig) config = { ...config, ...JSON.parse(rawConfig) };
}

function guardarBoletos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boletos));
}

function guardarConfig() {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function formatoDinero(valor) {
  return '$' + Number(valor || 0).toLocaleString('es-CO');
}

function formatoNumero(num) {
  return String(num).padStart(3, '0');
}

function mostrarToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 2200);
}

/* ---------- RENDER ---------- */

function renderConfigTexto() {
  document.getElementById('rifaTitulo').textContent = config.titulo;
  document.getElementById('rifaPremio').textContent = config.premio;
  document.getElementById('rifaPrecio').textContent = formatoDinero(config.precio);
}

function renderGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  let vendidos = 0, recaudado = 0, pendientes = 0;

  for (let i = 1; i <= 100; i++) {
    const b = boletos[i];
    const btn = document.createElement('button');
    btn.className = 'numero';
    btn.textContent = formatoNumero(i);

    if (b) {
      vendidos++;
      if (b.pagado) {
        btn.classList.add('vendido');
        recaudado += Number(config.precio) || 0;
      } else {
        btn.classList.add('pendiente');
        pendientes++;
      }
    } else {
      btn.classList.add('disponible');
    }

    btn.addEventListener('click', () => abrirModalNumero(i));
    grid.appendChild(btn);
  }

  document.getElementById('statVendidos').textContent = vendidos;
  document.getElementById('statDisponibles').textContent = 100 - vendidos;
  document.getElementById('statPendientes').textContent = pendientes;
  document.getElementById('statRecaudado').textContent = formatoDinero(recaudado);
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
  cerrarModal();
  mostrarToast(`✅ Número ${formatoNumero(numeroActivo)} vendido con éxito`);
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
  if (!isAdmin) {
    mostrarToast('🔒 Activa el modo Admin para liberar un número');
    return;
  }
  if (!confirm(`¿Seguro que deseas liberar el número ${formatoNumero(numeroActivo)}? Esto borrará los datos del comprador.`)) return;
  delete boletos[numeroActivo];
  guardarBoletos();
  renderGrid();
  cerrarModal();
  mostrarToast(`🚫 Número ${formatoNumero(numeroActivo)} liberado`);
}

/* ---------- SORTEO ---------- */

function sortear() {
  const vendidos = Object.keys(boletos);
  if (vendidos.length === 0) {
    document.getElementById('sorteoVacio').classList.remove('hidden');
    document.getElementById('sorteoResultado').classList.add('hidden');
    return;
  }
  const ganador = vendidos[Math.floor(Math.random() * vendidos.length)];
  const datos = boletos[ganador];

  document.getElementById('sorteoVacio').classList.add('hidden');
  document.getElementById('numeroGanador').textContent = formatoNumero(ganador);
  document.getElementById('ganadorNombre').textContent = datos.nombre;
  document.getElementById('ganadorTelefono').textContent = '📞 ' + datos.telefono;

  const resultado = document.getElementById('sorteoResultado');
  resultado.classList.remove('hidden');
  resultado.style.animation = 'none';
  requestAnimationFrame(() => { resultado.style.animation = ''; });
}

/* ---------- ADMIN ---------- */

function actualizarUIAdmin() {
  const btns = [document.getElementById('btnAdminToggle')];
  btns.forEach(b => {
    b.textContent = isAdmin ? '🔓 Admin Activo' : '🔒 Modo Admin';
    b.classList.toggle('btn-guardar', isAdmin);
  });
  document.getElementById('tabBtnConfig').classList.toggle('hidden', !isAdmin);
  if (!isAdmin) cambiarTab('dashboard');
}

function abrirModalPin() {
  document.getElementById('pinError').classList.add('hidden');
  document.getElementById('inputPin').value = '';
  document.getElementById('pinOverlay').classList.remove('hidden');
}

function cerrarModalPin() {
  document.getElementById('pinOverlay').classList.add('hidden');
}

function confirmarPin() {
  const val = document.getElementById('inputPin').value.trim();
  if (val === ADMIN_PIN) {
    isAdmin = true;
    actualizarUIAdmin();
    cerrarModalPin();
    mostrarToast('🔓 Modo Admin activado');
  } else {
    document.getElementById('pinError').classList.remove('hidden');
  }
}

/* ---------- CONFIG ---------- */

function cargarConfigForm() {
  document.getElementById('inputTitulo').value = config.titulo;
  document.getElementById('inputPremio').value = config.premio;
  document.getElementById('inputPrecio').value = config.precio;
}

function guardarConfigForm() {
  const titulo = document.getElementById('inputTitulo').value.trim() || config.titulo;
  const premio = document.getElementById('inputPremio').value.trim() || config.premio;
  const precio = Number(document.getElementById('inputPrecio').value) || 0;
  config = { titulo, premio, precio };
  guardarConfig();
  renderConfigTexto();
  renderGrid();
  mostrarToast('💾 Configuración guardada');
}

function exportarCSV() {
  const filas = [['Número', 'Nombre', 'Teléfono', 'Pagado']];
  for (let i = 1; i <= 100; i++) {
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
  if (!confirm('Esto cargará 83 boletos de prueba con datos aleatorios (algunos ya vendidos serán omitidos). ¿Continuar?')) return;

  const disponibles = [];
  for (let i = 1; i <= 100; i++) {
    if (!boletos[i]) disponibles.push(i);
  }

  const cantidad = Math.min(83, disponibles.length);
  for (let j = 0; j < disponibles.length; j++) {
    const k = Math.floor(Math.random() * disponibles.length);
    [disponibles[j], disponibles[k]] = [disponibles[k], disponibles[j]];
  }

  const seleccionados = disponibles.slice(0, cantidad);
  seleccionados.forEach((num, idx) => {
    const nombre = NOMBRES_PRUEBA[idx % NOMBRES_PRUEBA.length];
    boletos[num] = {
      nombre,
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
  renderConfigTexto();
  renderGrid();
  cargarConfigForm();
  actualizarUIAdmin();

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

  document.getElementById('btnSortear').addEventListener('click', sortear);

  document.getElementById('btnAdminToggle').addEventListener('click', () => {
    if (isAdmin) {
      isAdmin = false;
      actualizarUIAdmin();
      mostrarToast('🔒 Modo Admin desactivado');
    } else {
      abrirModalPin();
    }
  });
  document.getElementById('pinClose').addEventListener('click', cerrarModalPin);
  document.getElementById('pinOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'pinOverlay') cerrarModalPin();
  });
  document.getElementById('btnConfirmarPin').addEventListener('click', confirmarPin);
  document.getElementById('inputPin').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmarPin();
  });

  document.getElementById('btnGuardarConfig').addEventListener('click', guardarConfigForm);
  document.getElementById('btnExportar').addEventListener('click', exportarCSV);
  document.getElementById('btnDatosPrueba').addEventListener('click', cargarDatosPrueba);
  document.getElementById('btnReiniciar').addEventListener('click', reiniciarRifa);
}

document.addEventListener('DOMContentLoaded', init);
