/*
 * Calculadora WEB - Rebeca Mary Astacio Bryan (2025-2264)
 * JavaScript ES5.
 *
 * Funciona como una calculadora de bolsillo (maquina de estados):
 * se guarda el operando A, luego el operador y despues se escribe el operando B.
 * Al pulsar "=" o al elegir otro operador se resuelve la operacion pendiente.
 */

var CLAVE_HISTORIAL = 'rebeca_historial';
var SIMBOLOS = { '+': '+', '-': '−', '*': '×', '/': '÷' };
var MENSAJE_DIVISION = 'No se puede dividir entre cero';

var estado = {
  operandoA: null,    // numero escrito antes del operador
  operador: null,     // '+', '-', '*', '/' o null si no hay operacion pendiente
  entrada: '0',       // texto del numero que se ve abajo en la pantalla
  numeroNuevo: true,  // la proxima cifra empieza un numero nuevo
  resumen: '',        // linea de arriba despues de un resultado, ej. "12 + 8 ="
  hayError: false
};

var historial = [];
var visorOperacion, visorNumero, listaHistorial, mensajeVacio, contador, btnEliminar;

/* ---------- Calculo ---------- */

// Quita los errores de coma flotante: 0.1 + 0.2 da 0.3 y no 0.30000000000000004
function redondear(numero) {
  return parseFloat(numero.toPrecision(12));
}

function operar(a, operador, b) {
  if (operador === '+') return a + b;
  if (operador === '-') return a - b;
  if (operador === '*') return a * b;
  return a / b;
}

// Resuelve "A operador B". Devuelve false si hubo division entre cero.
function resolver() {
  var a = estado.operandoA;
  var b = parseFloat(estado.entrada);
  var texto = a + ' ' + SIMBOLOS[estado.operador] + ' ' + b;

  estado.operandoA = null;
  estado.numeroNuevo = true;
  estado.resumen = texto;

  if (estado.operador === '/' && b === 0) {
    estado.operador = null;
    estado.hayError = true; // el error no se guarda en el historial
    return false;
  }

  var resultado = redondear(operar(a, estado.operador, b));
  estado.operador = null;
  estado.entrada = String(resultado);
  estado.resumen = texto + ' =';
  agregarAlHistorial(texto, resultado);
  return true;
}

/* ---------- Acciones de las teclas ---------- */

function escribirDigito(digito) {
  if (estado.hayError) reiniciar();

  if (estado.numeroNuevo) {
    estado.entrada = digito === '.' ? '0.' : digito;
    estado.numeroNuevo = false;
    estado.resumen = '';
  } else if (digito === '.') {
    if (estado.entrada.indexOf('.') === -1) estado.entrada += '.';
  } else if (estado.entrada === '0') {
    estado.entrada = digito;
  } else if (estado.entrada.replace(/[-.]/g, '').length < 15) {
    estado.entrada += digito;
  }
  pintar();
}

function elegirOperador(operador) {
  if (estado.hayError) return;

  // encadenado (ej. 2 + 3 ×): primero se resuelve lo que estaba pendiente
  if (estado.operador !== null && !estado.numeroNuevo && !resolver()) {
    pintar();
    return;
  }
  estado.operandoA = parseFloat(estado.entrada);
  estado.operador = operador;
  estado.numeroNuevo = true;
  pintar();
}

function calcularResultado() {
  if (estado.hayError || estado.operador === null) return;
  resolver();
  pintar();
}

function borrarUltimo() {
  if (estado.hayError) {
    reiniciar();
    return;
  }
  if (estado.numeroNuevo) return; // no se borran resultados ni el operando A
  var recortado = estado.entrada.slice(0, -1);
  estado.entrada = (recortado === '' || recortado === '-') ? '0' : recortado;
  pintar();
}

function reiniciar() {
  estado.operandoA = null;
  estado.operador = null;
  estado.entrada = '0';
  estado.numeroNuevo = true;
  estado.resumen = '';
  estado.hayError = false;
  pintar();
}

function ejecutar(accion, valor) {
  if (accion === 'digito') escribirDigito(valor);
  else if (accion === 'operador') elegirOperador(valor);
  else if (accion === 'igual') calcularResultado();
  else if (accion === 'retroceso') borrarUltimo();
  else if (accion === 'limpiar') reiniciar();
}

/* ---------- Pantalla ---------- */

function pintar() {
  if (estado.hayError) {
    visorOperacion.textContent = estado.resumen;
    visorNumero.textContent = MENSAJE_DIVISION;
    visorNumero.className = 'visor-numero error';
  } else {
    visorOperacion.textContent = estado.operador !== null
      ? estado.operandoA + ' ' + SIMBOLOS[estado.operador]
      : estado.resumen;
    visorNumero.textContent = estado.entrada;
    visorNumero.className = estado.entrada.length > 10 ? 'visor-numero largo' : 'visor-numero';
  }

  // resalta el operador que esta esperando el segundo numero
  var operadores = document.querySelectorAll('[data-accion="operador"]');
  for (var i = 0; i < operadores.length; i++) {
    if (estado.numeroNuevo && operadores[i].getAttribute('data-valor') === estado.operador) {
      operadores[i].classList.add('activo');
    } else {
      operadores[i].classList.remove('activo');
    }
  }
}

/* ---------- Historial en localStorage ---------- */

function dosCifras(n) {
  return (n < 10 ? '0' : '') + n;
}

function fechaActual() {
  var d = new Date();
  return dosCifras(d.getDate()) + '/' + dosCifras(d.getMonth() + 1) + '/' + d.getFullYear() +
    ' ' + dosCifras(d.getHours()) + ':' + dosCifras(d.getMinutes()) + ':' + dosCifras(d.getSeconds());
}

function cargarHistorial() {
  try {
    historial = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL)) || [];
  } catch (e) {
    historial = [];
  }
}

function guardarHistorial() {
  try {
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
  } catch (e) {
    // si el navegador bloquea localStorage el historial solo vive en memoria
  }
}

function agregarAlHistorial(operacion, resultado) {
  historial.push({ operacion: operacion, resultado: resultado, fecha: fechaActual() });
  guardarHistorial();
  pintarHistorial();
}

function eliminarHistorial() {
  if (historial.length === 0) return;
  if (!confirm('¿Seguro que deseas eliminar todo el historial?')) return;
  historial = [];
  try {
    localStorage.removeItem(CLAVE_HISTORIAL);
  } catch (e) {}
  pintarHistorial();
}

function pintarHistorial() {
  listaHistorial.innerHTML = '';

  // el calculo mas reciente va primero
  for (var i = historial.length - 1; i >= 0; i--) {
    var item = document.createElement('li');
    var calculo = document.createElement('span');
    var resultado = document.createElement('strong');
    var fecha = document.createElement('span');

    calculo.className = 'calculo';
    calculo.appendChild(document.createTextNode(historial[i].operacion + ' = '));
    resultado.textContent = historial[i].resultado;
    calculo.appendChild(resultado);

    fecha.className = 'fecha';
    fecha.textContent = historial[i].fecha;

    item.appendChild(calculo);
    item.appendChild(fecha);
    listaHistorial.appendChild(item);
  }

  contador.textContent = historial.length;
  mensajeVacio.style.display = historial.length ? 'none' : 'block';
  listaHistorial.style.display = historial.length ? 'block' : 'none';
  btnEliminar.disabled = historial.length === 0;
}

/* ---------- Eventos ---------- */

function alHacerClic(evento) {
  var boton = evento.target;
  if (boton.tagName !== 'BUTTON') return;
  ejecutar(boton.getAttribute('data-accion'), boton.getAttribute('data-valor'));
}

// Hunde la tecla en pantalla cuando se usa el teclado fisico
function hundirTecla(accion, valor) {
  var selector = '[data-accion="' + accion + '"]' + (valor ? '[data-valor="' + valor + '"]' : '');
  var boton = document.querySelector(selector);
  if (!boton) return;
  boton.classList.add('pulsada');
  setTimeout(function () {
    boton.classList.remove('pulsada');
  }, 120);
}

function alTeclear(evento) {
  if (evento.ctrlKey || evento.metaKey || evento.altKey) return;

  var tecla = evento.key;
  var accion = null;
  var valor = null;

  if (/^[0-9.]$/.test(tecla)) { accion = 'digito'; valor = tecla; }
  else if (tecla === ',') { accion = 'digito'; valor = '.'; }
  else if (/^[+\-*\/]$/.test(tecla)) { accion = 'operador'; valor = tecla; }
  else if (tecla === 'Enter' || tecla === '=') accion = 'igual';
  else if (tecla === 'Backspace') accion = 'retroceso';
  else if (tecla === 'Escape' || tecla === 'Delete') accion = 'limpiar';
  else return;

  evento.preventDefault(); // evita que Enter vuelva a pulsar el boton enfocado
  ejecutar(accion, valor);
  hundirTecla(accion, valor);
}

function iniciar() {
  visorOperacion = document.getElementById('visorOperacion');
  visorNumero = document.getElementById('visorNumero');
  listaHistorial = document.getElementById('listaHistorial');
  mensajeVacio = document.getElementById('historialVacio');
  contador = document.getElementById('contador');
  btnEliminar = document.getElementById('btnEliminar');

  document.getElementById('teclado').addEventListener('click', alHacerClic);
  btnEliminar.addEventListener('click', eliminarHistorial);
  document.addEventListener('keydown', alTeclear);

  cargarHistorial();
  pintar();
  pintarHistorial();
}

iniciar();
