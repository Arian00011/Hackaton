const mesasContainer = document.getElementById("mesas");
const resumenText = document.getElementById("resumenText");
const form = document.getElementById("formReserva");
const contador = document.getElementById("contador");
const fechaInput = document.getElementById("fecha");
const mensajeCover = document.getElementById("mensajeCover");
const decoracionCheckbox = document.getElementById("decoracion");

let seleccionadas = [];
let tiempo = 900;
let timer;

function generarMesas() {
  for (let i = 1; i <= 23; i++) {
    const div = document.createElement("div");
    div.classList.add("mesa");
    div.id = "mesa" + i;
    div.textContent = "M" + i;
    div.onclick = () => seleccionarMesa(i);
    mesasContainer.appendChild(div);
  }
}

function obtenerClaveReserva() {
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;
  return fecha && hora ? `${fecha}_${hora}` : null;
}

function actualizarMesasOcupadas() {
  const clave = obtenerClaveReserva();
  if (!clave) return;

  const ocupadasPorFecha = JSON.parse(localStorage.getItem("mesasOcupadasPorFecha")) || {};
  const ocupadas = ocupadasPorFecha[clave] || [];

  document.querySelectorAll(".mesa").forEach(m => m.classList.remove("ocupada", "seleccionada"));
  ocupadas.forEach(n => {
    const m = document.getElementById("mesa" + n);
    if (m) m.classList.add("ocupada");
  });

  seleccionadas = [];
}

function seleccionarMesa(n) {
  const m = document.getElementById("mesa" + n);
  if (m.classList.contains("ocupada")) return;
  if (m.classList.contains("seleccionada")) {
    m.classList.remove("seleccionada");
    seleccionadas = seleccionadas.filter(x => x !== n);
  } else {
    m.classList.add("seleccionada");
    seleccionadas.push(n);
    if (seleccionadas.length === 1) iniciarContador();
  }
}

function iniciarContador() {
  clearInterval(timer);
  tiempo = 900;
  timer = setInterval(() => {
    if (tiempo <= 0) {
      liberar();
      alert("Tiempo expirado. Debes volver a seleccionar tus mesas.");
    } else {
      const min = Math.floor(tiempo / 60);
      const sec = tiempo % 60;
      contador.textContent = `Tiempo restante: ${min}:${sec < 10 ? '0' : ''}${sec}`;
      tiempo--;
    }
  }, 1000);
}

function liberar() {
  seleccionadas.forEach(n => {
    const m = document.getElementById("mesa" + n);
    if (m) m.classList.remove("seleccionada");
  });
  seleccionadas = [];
  clearInterval(timer);
  contador.textContent = "";
}

function calcularCover(fecha) {
  const dia = new Date(fecha).getDay();
  if (isNaN(dia)) {
    mensajeCover.textContent = "";
    return 0;
  }
  if (dia === 6) {
    mensajeCover.textContent = "El cover consumible aplica porque es sábado. Costo: $20.000 COP.";
    return 20000;
  }
  mensajeCover.textContent = "El cover consumible solo aplica los sábados.";
  return 0;
}

form.onsubmit = (e) => {
  e.preventDefault();

  if (seleccionadas.length === 0) {
    alert("Debes seleccionar al menos una mesa.");
    return;
  }

  const nombre = document.getElementById("nombre").value;
  const personas = document.getElementById("personas").value;
  const decoracion = decoracionCheckbox.checked;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;
  const clave = obtenerClaveReserva();
  if (!clave) {
    alert("Fecha y hora son obligatorias.");
    return;
  }

  const costoDecoracion = decoracion ? 50000 : 0;
  const costoCover = new Date(fecha).getDay() === 6 ? 20000 : 0;
  const costoMesas = seleccionadas.length * 50000;
  const total = costoMesas + costoDecoracion + costoCover;

  mensajeCover.textContent = costoCover > 0
    ? "El cover consumible aplica porque es sábado. Costo: $20.000 COP."
    : "El cover consumible solo aplica los sábados.";

  const resumen = `
    <strong>Reserva para:</strong> ${nombre}<br>
    <strong>Mesas:</strong> ${seleccionadas.join(", ")}<br>
    <strong>Personas:</strong> ${personas}<br>
    <strong>Decoración:</strong> ${decoracion ? "Sí (+$50.000)" : "No"}<br>
    ${costoCover > 0 ? "<strong>Cover:</strong> Sí (+$20.000)<br>" : ""}
    <strong>Total:</strong> ${total.toLocaleString()} COP
  `;
  resumenText.innerHTML = resumen;

  // Enviar datos al servidor ANTES de limpiar seleccionadas
  fetch('http://localhost:5000/reservar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre,
      fecha,
      hora,
      mesas: [...seleccionadas],
      personas,
      decoracion,
      cover: costoCover,
      total
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Reserva guardada en CSV:", data);
  })
  .catch(err => console.error("Error al guardar la reserva:", err));

  const ocupadasPorFecha = JSON.parse(localStorage.getItem("mesasOcupadasPorFecha")) || {};
  ocupadasPorFecha[clave] = [...new Set([...(ocupadasPorFecha[clave] || []), ...seleccionadas])];
  localStorage.setItem("mesasOcupadasPorFecha", JSON.stringify(ocupadasPorFecha));

  actualizarMesasOcupadas();
  clearInterval(timer);
  seleccionadas = [];
  contador.textContent = "";

  alert("¡Tu reserva ya quedó lista!");
};

fechaInput.addEventListener("change", () => {
  calcularCover(fechaInput.value);
  actualizarMesasOcupadas();
});
document.getElementById("hora").addEventListener("change", actualizarMesasOcupadas);

window.onload = () => {
  generarMesas();
  actualizarMesasOcupadas();
};