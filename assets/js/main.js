/* =====================================================================
   Dr. Raimundo Vinícius — comportamento da landing page
   Vanilla JS, sem dependências. Todo efeito tem fallback estático
   quando o usuário pede menos movimento.
   ===================================================================== */

(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var prefersLessMotion = function () { return reduceMotion.matches; };

  /* ------------------------------------------------------------------
     1. Header: cápsula de vidro sobre o hero, mais fechada ao rolar
     ------------------------------------------------------------------ */
  (function header() {
    var el = document.querySelector('[data-header]');
    if (!el) return;

    var ticking = false;
    var apply = function () {
      el.classList.toggle('is-stuck', window.scrollY > 24);
      ticking = false;
    };

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }, { passive: true });

    apply();
  })();

  /* ------------------------------------------------------------------
     2. Menu mobile
     ------------------------------------------------------------------ */
  (function mobileNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.getElementById('nav-principal');
    if (!toggle || !nav) return;

    var close = function (returnFocus) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      nav.classList.toggle('is-open', !open);
      toggle.setAttribute('aria-expanded', String(!open));
    });

    // Fecha ao escolher um destino
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) close(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') close(true);
    });

    // Ao voltar para desktop, garante estado limpo
    window.matchMedia('(min-width: 62rem)').addEventListener('change', function (e) {
      if (e.matches) close(false);
    });
  })();

  /* ------------------------------------------------------------------
     3. Ênfase ao entrar no viewport — só nos blocos de prova social
     ------------------------------------------------------------------ */
  (function reveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (prefersLessMotion() || !('IntersectionObserver' in window)) return;

    Array.prototype.forEach.call(items, function (el) {
      el.classList.add('reveal-pending');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('reveal-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  })();

  /* ------------------------------------------------------------------
     4. FAQ — acordeão acessível
     ------------------------------------------------------------------ */
  (function faq() {
    var triggers = document.querySelectorAll('.faq__trigger');
    if (!triggers.length) return;

    Array.prototype.forEach.call(triggers, function (trigger) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;

      trigger.addEventListener('click', function () {
        var open = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!open));

        if (prefersLessMotion()) {
          panel.hidden = open;
          panel.style.height = '';
          return;
        }

        var inner = panel.firstElementChild;
        var target = inner ? inner.offsetHeight : 0;

        if (!open) {
          panel.hidden = false;
          target = inner ? inner.offsetHeight : 0;
          panel.style.height = '0px';
          panel.classList.add('is-animating');
          window.requestAnimationFrame(function () {
            panel.style.height = target + 'px';
          });
        } else {
          panel.style.height = panel.offsetHeight + 'px';
          panel.classList.add('is-animating');
          window.requestAnimationFrame(function () {
            panel.style.height = '0px';
          });
        }
      });

      panel.addEventListener('transitionend', function (e) {
        if (e.propertyName !== 'height') return;
        var open = trigger.getAttribute('aria-expanded') === 'true';
        panel.classList.remove('is-animating');
        panel.style.height = '';
        panel.hidden = !open;
      });
    });
  })();

  /* ------------------------------------------------------------------
     5. Formulário — validação inline e envio pelo WhatsApp
     ------------------------------------------------------------------ */
  (function form() {
    var form = document.querySelector('[data-form]');
    if (!form) return;

    var status = form.querySelector('[data-form-status]');
    var nome = form.querySelector('#nome');
    var mensagem = form.querySelector('#mensagem');
    var numero = form.getAttribute('data-whatsapp');

    var errorFor = function (field) {
      return form.querySelector('[data-error-for="' + field.id + '"]');
    };

    var showError = function (field, message) {
      var box = errorFor(field);
      field.setAttribute('aria-invalid', 'true');
      if (box) { box.textContent = message; box.hidden = false; }
    };

    var clearError = function (field) {
      var box = errorFor(field);
      field.removeAttribute('aria-invalid');
      if (box) { box.textContent = ''; box.hidden = true; }
    };

    nome.addEventListener('input', function () {
      if (nome.getAttribute('aria-invalid')) clearError(nome);
    });

    var validate = function () {
      var firstInvalid = null;

      if (nome.value.trim().length < 2) {
        showError(nome, 'Informe seu nome para o contato.');
        firstInvalid = firstInvalid || nome;
      } else {
        clearError(nome);
      }

      return firstInvalid;
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (status) status.textContent = '';

      var invalid = validate();
      if (invalid) {
        invalid.focus();
        return;
      }

      /* O destino é o WhatsApp do consultório: montamos a mensagem e abrimos
         a conversa já preenchida. Nada trafega por servidor nosso — quem envia
         é o próprio paciente, do aparelho dele. */
      var linhas = [
        'Olá! Gostaria de agendar uma avaliação.',
        '',
        'Nome: ' + nome.value.trim()
      ];

      var extra = mensagem ? mensagem.value.trim() : '';
      if (extra) { linhas.push('', extra); }

      var url = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(linhas.join('\n'));
      var aba = window.open(url, '_blank', 'noopener');

      if (status) {
        status.textContent = '';
        status.appendChild(document.createTextNode(
          aba ? 'Abrimos o WhatsApp com sua mensagem. ' : 'Seu navegador bloqueou a nova aba. '
        ));
        var link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.className = 'link-quiet';
        link.textContent = aba ? 'Não abriu? Toque aqui.' : 'Abrir a conversa.';
        status.appendChild(link);
      }

      /* o formulário não é limpo de propósito: se a aba foi bloqueada, o que
         a pessoa escreveu continua ali para ela tentar de novo */
    });
  })();

  /* ------------------------------------------------------------------
     6. Botão flutuante do WhatsApp: espera o CTA do hero sair da tela,
        senão pousaria em cima do botão principal na primeira dobra.
        Na página de termos não há hero, então nasce visível.
     ------------------------------------------------------------------ */
  (function zap() {
    var botao = document.querySelector('[data-zap]');
    if (!botao) return;

    var mostrar = function () { botao.classList.add('is-visivel'); };

    var cta = document.querySelector('.hero__action');
    if (!cta || !('IntersectionObserver' in window)) { mostrar(); return; }

    var io = new IntersectionObserver(function (entries) {
      botao.classList.toggle('is-visivel', !entries[0].isIntersecting);
    });

    io.observe(cta);
  })();

  /* ------------------------------------------------------------------
     7. Ano do rodapé
     ------------------------------------------------------------------ */
  (function year() {
    var el = document.querySelector('[data-year]');
    if (el) el.textContent = String(new Date().getFullYear());
  })();

})();
