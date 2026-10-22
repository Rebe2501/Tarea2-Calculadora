/*
 * Calculadora de bolsillo - Rebeca Mary Astacio Bryan (2025-2264)
 * Escrita en ES5: solo var y function.
 *
 * Se comporta como una calculadora fisica sencilla: primero se escribe un
 * numero, luego el signo y despues el segundo numero. La cuenta se cierra con
 * "=" o al pulsar otro signo, y entonces se anota en la bitacora.
 */

var CLAVE_BITACORA = 'calcRebeca.bitacora';
var GLIFOS = { '+': '+', '-': '−', '*': '×', '/': '÷' };
var AVISO_CERO = 'No se puede dividir entre cero';

var maquina = {
  primero: null,       // numero escrito antes del signo
  signo: null,         // '+', '-', '*', '/' o null si no hay cuenta abierta
  texto: '0',          // numero que se ve en grande
  empezarNumero: true, // la siguiente cifra arranca un numero desde cero
  linea: '',           // linea pequena de arriba, ej. "36 + 27 ="
  fallo: false
};

var bitacora = [];
var visorCuenta, visorValor, filasBitacora, rollo, avisoVacio, cantidad, btnVaciar;

/* ---------- Aritmetica ---------- */

// toPrecision(12) evita resultados como 0.7999999999999999
function pulir(n) {
  return parseFloat(n.toPrecision(12));
}

function aplicar(a, signo, b) {
  if (signo === '+') return a + b;
  if (signo === '-') return a - b;
  if (signo === '*') return a * b;
  return a / b;
}

// Cierra la cuenta "primero signo texto". Devuelve false si era una division entre cero.
function cerrarCuenta() {
  var a = maquina.primero;
  var b = parseFloat(maquina.texto);
  var cuenta = a + ' ' + GLIFOS[maquina.signo] + ' ' + b;

  maquina.primero = null;
  maquina.empezarNumero = true;
  maquina.linea = cuenta;

  if (maquina.signo === '/' && b === 0) {
    maquina.signo = null;
    maquina.fallo = true; // no se anota nada
    return false;
  }

  var valor = pulir(aplicar(a, maquina.signo, b));
  maquina.signo = null;
  maquina.texto = String(valor);
  maquina.linea = cuenta + ' =';
  anotar(cuenta, valor);
  return true;
}

/* ---------- Botones ---------- */

function teclearCifra(cifra) {
  if (maquina.fallo) todoACero();

  if (maquina.empezarNumero) {
    maquina.texto = cifra === '.' ? '0.' : cifra;
    maquina.empezarNumero = false;
    maquina.linea = '';
  } else if (cifra === '.') {
    if (maquina.texto.indexOf('.') === -1) maquina.texto += '.';
  } else if (maquina.texto === '0') {
    maquina.texto = cifra;
  } else if (maquina.texto.replace(/[-.]/g, '').length < 15) {
    maquina.texto += cifra;
  }
  refrescarVisor();
}

function fijarSigno(signo) {
  if (maquina.fallo) return;

  // 2 + 3 x : antes de cambiar de signo se cierra la cuenta abierta
  if (maquina.signo !== null && !maquina.empezarNumero && !cerrarCuenta()) {
    refrescarVisor();
    return;
  }
  maquina.primero = parseFloat(maquina.texto);
  maquina.signo = signo;
  maquina.empezarNumero = true;
  refrescarVisor();
}

function pedirTotal() {
  if (maquina.fallo || maquina.signo === null) return;
  cerrarCuenta();
  refrescarVisor();
}

function quitarCifra() {
  if (maquina.fallo) {
    todoACero();
    return;
  }
  if (maquina.empezarNumero) return; // un total o el primer numero no se recortan
  var resto = maquina.texto.slice(0, -1);
  maquina.texto = (resto === '' || resto === '-') ? '0' : resto;
  refrescarVisor();
}

function todoACero() {
  maquina.primero = null;
  maquina.signo = null;
  maquina.texto = '0';
  maquina.empezarNumero = true;
  maquina.linea = '';
  maquina.fallo = false;
  refrescarVisor();
}

function despachar(accion, valor) {
  if (accion === 'cifra') teclearCifra(valor);
  else if (accion === 'signo') fijarSigno(valor);
  else if (accion === 'total') pedirTotal();
  else if (accion === 'del') quitarCifra();
  else if (accion === 'ac') todoACero();
}

/* ---------- Visor ---------- */

function refrescarVisor() {
  if (maquina.fallo) {
    visorCuenta.textContent = maquina.linea;
    visorValor.textContent = AVISO_CERO;
    visorValor.className = 'visor-valor aviso';
  } else {
    visorCuenta.textContent = maquina.signo !== null
      ? maquina.primero + ' ' + GLIFOS[maquina.signo]
      : maquina.linea;
    visorValor.textContent = maquina.texto;
    visorValor.className = maquina.texto.length > 10 ? 'visor-valor chico' : 'visor-valor';
  }

  // el signo elegido queda encendido mientras se espera el segundo numero
  var signos = document.querySelectorAll('[data-accion="signo"]');
  for (var i = 0; i < signos.length; i++) {
    var encendido = maquina.empezarNumero && signos[i].getAttribute('data-valor') === maquina.signo;
    signos[i].className = 'boton boton--signo' + (encendido ? ' encendido' : '');
  }
}

/* ---------- Bitacora en localStorage ---------- */

function conCero(n) {
  return (n < 10 ? '0' : '') + n;
}

function sello() {
  var d = new Date();
  return conCero(d.getDate()) + '/' + conCero(d.getMonth() + 1) + '/' + d.getFullYear() +
    ' ' + conCero(d.getHours()) + ':' + conCero(d.getMinutes()) + ':' + conCero(d.getSeconds());
}

function leerBitacora() {
  try {
    bitacora = JSON.parse(localStorage.getItem(CLAVE_BITACORA)) || [];
  } catch (e) {
    bitacora = [];
  }
}

function escribirBitacora() {
  try {
    if (bitacora.length) localStorage.setItem(CLAVE_BITACORA, JSON.stringify(bitacora));
    else localStorage.removeItem(CLAVE_BITACORA);
  } catch (e) {
    // con localStorage bloqueado la bitacora dura solo mientras la pagina este abierta
  }
  dibujarBitacora();
}

function anotar(cuenta, valor) {
  bitacora.push({ cuenta: cuenta, valor: valor, cuando: sello() });
  escribirBitacora();
  rollo.scrollTop = rollo.scrollHeight; // la anotacion nueva queda a la vista
}

function quitarAnotacion(indice) {
  bitacora.splice(indice, 1);
  escribirBitacora();
}

function vaciarBitacora() {
  if (!bitacora.length) return;
  if (!confirm('Se borrarán las ' + bitacora.length + ' anotaciones de la bitácora. ¿Continuar?')) return;
  bitacora = [];
  escribirBitacora();
}

function celda(fila, texto, clase) {
  var td = document.createElement('td');
  td.textContent = texto;
  if (clase) td.className = clase;
  fila.appendChild(td);
  return td;
}

// Orden cronologico: la primera cuenta arriba, la ultima abajo
function dibujarBitacora() {
  filasBitacora.innerHTML = '';

  for (var i = 0; i < bitacora.length; i++) {
    var fila = document.createElement('tr');
    var quitar = document.createElement('button');

    celda(fila, i + 1, 'num');
    celda(fila, bitacora[i].cuenta);
    celda(fila, bitacora[i].valor, 'total');
    celda(fila, bitacora[i].cuando, 'cuando');

    quitar.type = 'button';
    quitar.className = 'quitar';
    quitar.setAttribute('data-indice', i);
    quitar.setAttribute('aria-label', 'Quitar la anotación ' + (i + 1));
    quitar.title = 'Quitar esta anotación';
    quitar.textContent = '×';
    celda(fila, '').appendChild(quitar);

    filasBitacora.appendChild(fila);
  }

  var n = bitacora.length;
  cantidad.textContent = n + (n === 1 ? ' anotación' : ' anotaciones');
  avisoVacio.style.display = n ? 'none' : 'block';
  rollo.style.display = n ? 'block' : 'none';
  btnVaciar.disabled = n === 0;
}

/* ---------- Eventos ---------- */

function clicEnBotonera(evento) {
  var b = evento.target;
  if (b.tagName === 'BUTTON') despachar(b.getAttribute('data-accion'), b.getAttribute('data-valor'));
}

function clicEnBitacora(evento) {
  var b = evento.target;
  if (b.tagName === 'BUTTON') quitarAnotacion(parseInt(b.getAttribute('data-indice'), 10));
}

// Con el teclado fisico, el boton dibujado se hunde un instante
function marcarBoton(accion, valor) {
  var selector = '[data-accion="' + accion + '"]' + (valor ? '[data-valor="' + valor + '"]' : '');
  var b = document.querySelector(selector);
  if (!b) return;
  b.classList.add('hundido');
  setTimeout(function () {
    b.classList.remove('hundido');
  }, 120);
}

function teclaFisica(evento) {
  if (evento.ctrlKey || evento.metaKey || evento.altKey) return;

  var k = evento.key;
  var accion = null;
  var valor = null;

  if (/^[0-9.]$/.test(k)) { accion = 'cifra'; valor = k; }
  else if (k === ',') { accion = 'cifra'; valor = '.'; }
  else if (/^[+\-*\/]$/.test(k)) { accion = 'signo'; valor = k; }
  else if (k === 'Enter' || k === '=') accion = 'total';
  else if (k === 'Backspace') accion = 'del';
  else if (k === 'Escape' || k === 'Delete') accion = 'ac';
  else return;

  evento.preventDefault(); // Enter no debe volver a pulsar el boton que tenga el foco
  despachar(accion, valor);
  marcarBoton(accion, valor);
}

function arrancar() {
  visorCuenta = document.getElementById('visorCuenta');
  visorValor = document.getElementById('visorValor');
  filasBitacora = document.getElementById('filasBitacora');
  rollo = document.getElementById('rollo');
  avisoVacio = document.getElementById('bitacoraVacia');
  cantidad = document.getElementById('cantidad');
  btnVaciar = document.getElementById('btnVaciar');

  document.getElementById('botonera').addEventListener('click', clicEnBotonera);
  filasBitacora.addEventListener('click', clicEnBitacora);
  btnVaciar.addEventListener('click', vaciarBitacora);
  document.addEventListener('keydown', teclaFisica);

  leerBitacora();
  refrescarVisor();
  dibujarBitacora();
}

arrancar();
