/* ==========================================================================
   Órbita · Interacciones de demostración

   Todo ocurre en memoria: no hay peticiones a servidores ni almacenamiento.
   Al recargar la página, cada elemento vuelve a su estado inicial.

   Índice
     1. Utilidades
     2. Navegación
     3. Me gusta, guardar y seguir
     4. Menús emergentes
     5. Historias
     6. Leyendas y comentarios
     7. Conexión con los eventos
   ========================================================================== */

(function () {
  'use strict';

  /* Cuenta ficticia que firma los comentarios de prueba. */
  const USUARIO_ACTUAL = 'sofia.rivas';


  /* 1. Utilidades
     ======================================================================== */
  const formatoNumero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

  /* 8426 → "8426" · 12431 → "12,4 mil", igual que los contadores de la referencia. */
  function formatearCantidad(cantidad) {
    return cantidad >= 10000 ? formatoNumero.format(cantidad / 1000) + ' mil' : String(cantidad);
  }

  /* Suma al contador y actualiza su texto. */
  function sumarCantidad(contador, diferencia) {
    const cantidad = Number(contador.dataset.cantidad) + diferencia;
    contador.dataset.cantidad = cantidad;
    contador.textContent = formatearCantidad(cantidad);
  }

  /* Invierte aria-pressed, que es el atributo que usa el CSS para dibujar el estado. */
  function alternarPulsado(boton) {
    const pulsado = boton.getAttribute('aria-pressed') !== 'true';
    boton.setAttribute('aria-pressed', String(pulsado));
    return pulsado;
  }

  /* Reinicia una animación de CSS aunque ya se haya reproducido antes. */
  function reproducirLatido(boton) {
    boton.classList.remove('latido');
    void boton.offsetWidth;
    boton.classList.add('latido');
  }


  /* 2. Navegación
     ======================================================================== */

  /* Marca como seleccionado el destino pulsado, en el menú y en la barra móvil. */
  function seleccionarDestino(enlace) {
    const destino = enlace.dataset.nav;
    document.querySelectorAll('[data-nav]').forEach(function (elemento) {
      if (elemento.dataset.nav === destino) {
        elemento.setAttribute('aria-current', 'page');
      } else {
        elemento.removeAttribute('aria-current');
      }
    });
  }


  /* 3. Me gusta, guardar y seguir
     ======================================================================== */
  function alternarMeGusta(boton) {
    const activo = alternarPulsado(boton);
    sumarCantidad(boton.querySelector('.accion__cantidad'), activo ? 1 : -1);
    if (activo) {
      reproducirLatido(boton);
    }
  }

  function alternarMeGustaComentario(boton) {
    if (alternarPulsado(boton)) {
      reproducirLatido(boton);
    }
  }

  function alternarGuardado(boton) {
    const activo = alternarPulsado(boton);
    boton.setAttribute('aria-label', activo ? 'Quitar de guardados' : 'Guardar');
    if (activo) {
      reproducirLatido(boton);
    }
  }

  function alternarSeguir(boton) {
    boton.textContent = alternarPulsado(boton) ? 'Siguiendo' : 'Seguir';
  }


  /* 4. Menús emergentes
     ======================================================================== */
  function cerrarMenus(excepto) {
    document.querySelectorAll('.emergente:not([hidden])').forEach(function (menu) {
      if (menu !== excepto) {
        menu.hidden = true;
        menu.parentElement.querySelector('[data-menu]').setAttribute('aria-expanded', 'false');
      }
    });
  }

  function alternarMenu(boton) {
    const menu = boton.parentElement.querySelector('.emergente');
    cerrarMenus(menu);
    menu.hidden = !menu.hidden;
    boton.setAttribute('aria-expanded', String(!menu.hidden));
  }


  /* 5. Historias
     ======================================================================== */
  const listaHistorias = document.querySelector('.historias__lista');
  const flechaIzquierda = document.querySelector('.historias__flecha--izquierda');
  const flechaDerecha = document.querySelector('.historias__flecha--derecha');

  /* Cada flecha solo se muestra si queda algo por ver en esa dirección. */
  function actualizarFlechas() {
    const maximo = listaHistorias.scrollWidth - listaHistorias.clientWidth;
    flechaIzquierda.hidden = listaHistorias.scrollLeft <= 1;
    flechaDerecha.hidden = listaHistorias.scrollLeft >= maximo - 1;
  }

  function desplazarHistorias(flecha) {
    const sentido = flecha === flechaDerecha ? 1 : -1;
    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    listaHistorias.scrollBy({
      left: sentido * listaHistorias.clientWidth * 0.75,
      behavior: sinAnimacion ? 'auto' : 'smooth'
    });
  }

  /* No hay visor de historias: el anillo gira y queda en gris, como ya vista. */
  function verHistoria(historia) {
    historia.classList.add('historia--abriendo');
    historia.classList.add('historia--vista');
    window.setTimeout(function () {
      historia.classList.remove('historia--abriendo');
    }, 700);
  }


  /* 6. Leyendas y comentarios
     ======================================================================== */
  function expandirLeyenda(boton) {
    const leyenda = boton.closest('.post__leyenda');
    leyenda.querySelector('.post__recorte').hidden = true;
    leyenda.querySelector('.post__resto').hidden = false;
  }

  function enfocarComentario(boton) {
    boton.closest('.post').querySelector('.comentar__campo').focus();
  }

  /* "Publicar" solo se activa si hay texto escrito. */
  function actualizarPublicar(campo) {
    campo.form.querySelector('.comentar__enviar').disabled = campo.value.trim() === '';
  }

  /* Crea el comentario con textContent para que el texto nunca se interprete como HTML. */
  function crearComentario(texto) {
    const plantillaLike = document.querySelector('.comentario__like');

    const usuario = document.createElement('a');
    usuario.className = 'post__usuario';
    usuario.href = '#';
    usuario.textContent = USUARIO_ACTUAL;

    const parrafo = document.createElement('p');
    parrafo.className = 'comentario__texto';
    parrafo.append(usuario, ' ' + texto);

    const like = plantillaLike.cloneNode(true);
    like.setAttribute('aria-pressed', 'false');
    like.classList.remove('latido');

    const comentario = document.createElement('li');
    comentario.className = 'comentario comentario--nuevo';
    comentario.append(parrafo, like);
    return comentario;
  }

  function publicarComentario(formulario) {
    const campo = formulario.querySelector('.comentar__campo');
    const texto = campo.value.trim();
    if (texto === '') {
      return;
    }

    const post = formulario.closest('.post');
    post.querySelector('.comentarios').append(crearComentario(texto));

    const contador = post.querySelector('.accion--comentar .accion__cantidad');
    sumarCantidad(contador, 1);
    post.querySelector('.post__total-comentarios').textContent = contador.textContent;

    campo.value = '';
    actualizarPublicar(campo);
    campo.focus();
  }


  /* 7. Conexión con los eventos
     Un solo oyente por tipo de evento atiende a todos los elementos. Para añadir
     una interacción basta con sumar una línea a esta tabla.
     ======================================================================== */
  const accionesPorClic = [
    ['[data-menu]', alternarMenu],
    ['[data-nav]', seleccionarDestino],
    ['.accion--like', alternarMeGusta],
    ['.accion--guardar', alternarGuardado],
    ['.accion--comentar', enfocarComentario],
    ['.comentario__like', alternarMeGustaComentario],
    ['.boton-seguir', alternarSeguir],
    ['.sugerencia__seguir', alternarSeguir],
    ['.historia', verHistoria],
    ['.historias__flecha', desplazarHistorias],
    ['.post__mas', expandirLeyenda]
  ];

  document.addEventListener('click', function (evento) {
    /* Los enlaces son de demostración: no deben saltar al inicio de la página. */
    if (evento.target.closest('a[href="#"]')) {
      evento.preventDefault();
    }

    accionesPorClic.forEach(function (accion) {
      const elemento = evento.target.closest(accion[0]);
      if (elemento) {
        accion[1](elemento);
      }
    });

    /* Elegir una opción o pulsar fuera cierra el menú abierto. */
    const dentroDeMenu = evento.target.closest('.desplegable');
    if (!dentroDeMenu || evento.target.closest('.emergente__item')) {
      cerrarMenus();
    }
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.key !== 'Escape') {
      return;
    }
    const abierto = document.querySelector('.emergente:not([hidden])');
    if (abierto) {
      cerrarMenus();
      abierto.parentElement.querySelector('[data-menu]').focus();
    }
  });

  document.addEventListener('input', function (evento) {
    if (evento.target.matches('.comentar__campo')) {
      actualizarPublicar(evento.target);
    }
  });

  document.addEventListener('submit', function (evento) {
    if (evento.target.matches('.comentar')) {
      evento.preventDefault();
      publicarComentario(evento.target);
    }
  });

  listaHistorias.addEventListener('scroll', actualizarFlechas, { passive: true });
  window.addEventListener('resize', actualizarFlechas);
  actualizarFlechas();
})();
