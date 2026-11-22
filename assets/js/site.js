/* ==========================================================================
   +961 — site behaviour
   Cart, WhatsApp ordering, checkout, page transitions and motion.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Business settings. Edit these values to update the whole site.
     ------------------------------------------------------------------ */
  var CONFIG = {
    whatsapp: '9613179666',              // used for every WhatsApp link
    phoneDisplay: '+961 3 179 666',
    instagram: 'https://www.instagram.com/961o.fficial/',
    deliveryLebanon: 4,                  // PLACEHOLDER: delivery fee in USD inside Lebanon

    // Every order is emailed to rrabuaa99@gmail.com through Web3Forms (free).
    // This access key is linked to that inbox. It is public by design.
    web3formsKey: '4537d6ea-4e0d-40dd-b674-000211899699',

    // SETUP 2: card payments with Stripe (Visa, Mastercard). Paste your Stripe
    // PUBLISHABLE key (pk_live_...) here. The SECRET key goes in Netlify, never here.
    // Until it is set, the card option is hidden at checkout.
    stripePublishableKey: '',
    stripeCheckoutUrl: '/api/create-checkout'
  };

  // Each product lists its colours. The first colour is the default.
  var PRODUCTS = {
    hoodie: {
      id: 'hoodie', name: '+961 Hoodie', price: 19, url: 'hoodie.html', short: 'Hoodie',
      colours: {
        black: { label: 'Black', img: 'hoodie', tile: 'light',
          alt: ['+961 Hoodie in black, front view with a small white +961 print on the chest', '+961 Hoodie in black, back view with a large white +961 print across the back'],
          desc: 'A black hoodie with +961 printed small on the chest and large across the back. Relaxed through the body, made for every day.',
          print: '+961 printed in white on the chest and across the back' }
      }
    },
    tshirt: {
      id: 'tshirt', name: '+961 T-Shirt', price: 13, url: 't-shirt.html', short: 'T-Shirt',
      colours: {
        white: { label: 'White', img: 'tshirt', tile: 'dark',
          alt: ['+961 T-Shirt in white, front view with a small black +961 print on the chest', '+961 T-Shirt in white, back view with a large black +961 print across the back'],
          desc: 'A white t-shirt with +961 printed small on the chest and large across the back. Crew neck, short sleeves, an easy everyday fit.',
          print: '+961 printed in black on the chest and across the back' }
      }
    }
  };
  function colourKeys(id) { return Object.keys(PRODUCTS[id].colours); }
  function validColour(id, c) { return PRODUCTS[id].colours[c] ? c : colourKeys(id)[0]; }
  // One product in one colour, with everything the page needs to show it
  function pv(id, colour) {
    var p = PRODUCTS[id], key = validColour(id, colour), c = p.colours[key];
    var img = function (view, w) { return 'assets/img/' + c.img + '-' + view + '-' + w + '.webp'; };
    return {
      id: id, name: p.name, price: p.price, url: p.url, colourKey: key, colour: c.label,
      waName: c.label + ' ' + p.short, tile: c.tile, desc: c.desc, print: c.print,
      thumb: img('front', 600), img: img,
      views: [{ src: img('front', 1000), src600: img('front', 600), alt: c.alt[0] }, { src: img('back', 1000), src600: img('back', 600), alt: c.alt[1] }]
    };
  }
  var SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
  var ROUTES = ['index', 'shop', 'hoodie', 't-shirt', 'checkout', 'about', 'size-guide', 'faq', '404'];

  /* ------------------------------------------------------------------ utils */
  var doc = document, root = doc.documentElement;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function money(n) { return '$' + n; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function waLink(text) { return 'https://wa.me/' + CONFIG.whatsapp + (text ? '?text=' + encodeURIComponent(text) : ''); }
  var store = {
    get: function (k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) { /* storage unavailable */ } },
    del: function (k, s) { try { (s ? sessionStorage : localStorage).removeItem(k); } catch (e) { /* storage unavailable */ } }
  };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = (!reduce && window.gsap) ? window.gsap : null;
  var ST = G && window.ScrollTrigger ? window.ScrollTrigger : null;
  if (ST) G.registerPlugin(ST);
  var EASE = 'power3.out', EASE_IO = 'power3.inOut';

  var ICON = {
    minus: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    plus: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    wa: '<svg class="icon icon--wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>'
  };

  if (/[?&]placeholders\b/.test(location.search)) root.classList.add('show-placeholders');

  /* ------------------------------------------------------------------ smooth scroll */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    if (G) {
      if (ST) lenis.on('scroll', ST.update);
      G.ticker.add(function (t) { lenis.raf(t * 1000); });
      G.ticker.lagSmoothing(0);
    } else {
      var rafLoop = function (t) { lenis.raf(t); requestAnimationFrame(rafLoop); };
      requestAnimationFrame(rafLoop);
    }
  }
  function headerOffset() { return ($('#header') || { offsetHeight: 72 }).offsetHeight; }
  function scrollToY(y, immediate) {
    if (lenis) lenis.scrollTo(y, { immediate: !!immediate, force: true, duration: 1.1 });
    else window.scrollTo({ top: y, behavior: immediate || reduce ? 'auto' : 'smooth' });
  }
  function scrollToEl(el, immediate, extra) {
    var y = el.getBoundingClientRect().top + window.scrollY - headerOffset() - (extra || 24);
    scrollToY(Math.max(0, y), immediate);
  }
  var locks = 0;
  function lockScroll(on) {
    locks = Math.max(0, locks + (on ? 1 : -1));
    if (locks > 0) { if (lenis) lenis.stop(); root.style.overflow = 'hidden'; }
    else { if (lenis) lenis.start(); root.style.overflow = ''; }
  }

  /* ------------------------------------------------------------------ cart */
  var Cart = {
    items: [],
    load: function () {
      var v = [];
      try { v = JSON.parse(store.get('961-cart') || '[]'); } catch (e) { v = []; }
      this.items = Array.isArray(v) ? v.filter(function (i) {
        return i && PRODUCTS[i.id] && SIZES.indexOf(i.size) > -1 && i.qty > 0;
      }).map(function (i) { return { id: i.id, colour: validColour(i.id, i.colour), size: i.size, qty: Math.min(99, Math.max(1, i.qty | 0)) }; }) : [];
      var merged = [];
      this.items.forEach(function (i) {
        var same = merged.filter(function (m) { return m.id === i.id && m.colour === i.colour && m.size === i.size; })[0];
        if (same) same.qty = Math.min(99, same.qty + i.qty); else merged.push(i);
      });
      this.items = merged;
    },
    save: function () { store.set('961-cart', JSON.stringify(this.items)); renderCart(); },
    find: function (id, colour, size) { return this.items.filter(function (i) { return i.id === id && i.colour === colour && i.size === size; })[0]; },
    add: function (id, colour, size, qty) { colour = validColour(id, colour); var it = this.find(id, colour, size); if (it) it.qty = Math.min(99, it.qty + qty); else this.items.push({ id: id, colour: colour, size: size, qty: qty }); this.save(); },
    ensure: function (id, colour, size) { colour = validColour(id, colour); if (!this.find(id, colour, size)) this.add(id, colour, size, 1); },
    set: function (id, colour, size, qty) { var it = this.find(id, colour, size); if (!it) return; it.qty = Math.min(99, Math.max(1, qty)); this.save(); },
    remove: function (id, colour, size) { this.items = this.items.filter(function (i) { return !(i.id === id && i.colour === colour && i.size === size); }); this.save(); },
    clear: function () { this.items = []; this.save(); },
    count: function () { return this.items.reduce(function (n, i) { return n + i.qty; }, 0); },
    subtotal: function () { return this.items.reduce(function (n, i) { return n + i.qty * PRODUCTS[i.id].price; }, 0); }
  };
  Cart.load();
  window.addEventListener('storage', function (e) { if (e.key === '961-cart') { Cart.load(); renderCart(); } });

  function cartMessage() {
    var lines = Cart.items.map(function (i) {
      var p = pv(i.id, i.colour);
      return '- ' + p.waName + ', size ' + i.size + ', quantity ' + i.qty + ': ' + money(p.price * i.qty);
    });
    return "Hi +961, I'd like to order:\n" + lines.join('\n') + '\nTotal: ' + money(Cart.subtotal()) + ' (delivery not included)';
  }

  var cartEl = $('#cart');
  function renderCart() {
    var n = Cart.count();
    root.classList.toggle('has-bag', n > 0);
    root.style.setProperty('--bag-lines', Cart.items.length);
    try { doc.dispatchEvent(new CustomEvent('961:cart')); } catch (e) { /* old browser */ }
    $$('[data-cart-count]').forEach(function (el) {
      el.classList.toggle('has-items', n > 0);
      el.innerHTML = '<span>' + n + '</span>';
    });
    $$('[data-cart-open]').forEach(function (b) { b.setAttribute('aria-label', 'Open bag, ' + n + (n === 1 ? ' item' : ' items')); });
    if (!cartEl) return;
    $('[data-cart-title-count]', cartEl).textContent = n ? '(' + n + ')' : '';
    var list = $('[data-cart-lines]', cartEl), empty = $('[data-cart-empty]', cartEl), foot = $('[data-cart-foot]', cartEl);
    empty.hidden = n > 0; foot.hidden = n === 0; list.hidden = n === 0;
    list.innerHTML = Cart.items.map(function (i) {
      var p = pv(i.id, i.colour);
      return '<li class="line-item" data-id="' + i.id + '" data-colour="' + i.colour + '" data-size="' + i.size + '">' +
        '<a class="line-item__media tile--' + p.tile + '" href="' + p.url + (p.colourKey !== colourKeys(p.id)[0] ? '?colour=' + p.colourKey : '') + '"><img src="' + p.thumb + '" alt="' + esc(p.name) + ' in ' + p.colour.toLowerCase() + ', front view" width="600" height="750" loading="lazy" decoding="async"></a>' +
        '<div class="line-item__info">' +
          '<div class="line-item__top"><p class="line-item__name">' + esc(p.name) + '</p><p class="line-item__price">' + money(p.price * i.qty) + '</p></div>' +
          '<p class="small muted">' + p.colour + ' / ' + i.size + '</p>' +
          '<div class="line-item__actions">' +
            '<div class="qty" role="group" aria-label="Quantity, ' + esc(p.name) + ' size ' + i.size + '">' +
              '<button type="button" data-qty="-1" aria-label="Decrease quantity"' + (i.qty <= 1 ? ' disabled' : '') + '>' + ICON.minus + '</button>' +
              '<output aria-live="polite">' + i.qty + '</output>' +
              '<button type="button" data-qty="1" aria-label="Increase quantity"' + (i.qty >= 99 ? ' disabled' : '') + '>' + ICON.plus + '</button>' +
            '</div>' +
            '<button type="button" class="line-item__remove" data-remove>Remove</button>' +
          '</div>' +
        '</div></li>';
    }).join('');
    $('[data-cart-subtotal]', cartEl).textContent = money(Cart.subtotal());
    var wa = $('[data-cart-wa]', cartEl);
    if (wa) wa.href = waLink(n ? cartMessage() : "Hi +961, I'd like to place an order.");
  }
  if (cartEl) {
    cartEl.addEventListener('click', function (e) {
      var li = e.target.closest('.line-item');
      if (!li) return;
      var id = li.dataset.id, colour = li.dataset.colour, size = li.dataset.size, it = Cart.find(id, colour, size);
      var q = e.target.closest('[data-qty]');
      if (q && it) { Cart.set(id, colour, size, it.qty + parseInt(q.dataset.qty, 10)); var b = $('.line-item[data-id="' + id + '"][data-colour="' + colour + '"][data-size="' + size + '"] [data-qty="' + q.dataset.qty + '"]', cartEl); if (b && !b.disabled) b.focus(); return; }
      if (e.target.closest('[data-remove]')) {
        li.classList.add('is-leaving');
        setTimeout(function () { Cart.remove(id, colour, size); var c = $('[data-cart-close]', cartEl); if (!Cart.count() && c) c.focus(); }, reduce ? 0 : 300);
      }
    });
  }

  function bounceCart() {
    $$('.cart-btn').forEach(function (b) { b.classList.remove('is-bouncing'); void b.offsetWidth; b.classList.add('is-bouncing'); });
  }

  /* ------------------------------------------------------------------ overlays */
  var layers = [];
  var lastFocus = null;
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';
  function openLayer(el, opts) {
    if (layers.indexOf(el) > -1) return;
    lastFocus = doc.activeElement;
    layers.push(el);
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    if (opts && opts.scrim) $('.scrim').classList.add('is-open');
    lockScroll(true);
    updateChrome();
    setTimeout(function () { var f = (opts && opts.focus) || $(FOCUSABLE, el); if (f) f.focus({ preventScroll: true }); }, 60);
  }
  function closeLayer(el) {
    var i = layers.indexOf(el);
    if (i < 0) return;
    layers.splice(i, 1);
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    if (!layers.some(function (l) { return l === cartEl; })) $('.scrim').classList.remove('is-open');
    lockScroll(false);
    updateChrome();
    if (lastFocus && lastFocus.focus && doc.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  function closeAll() { layers.slice().reverse().forEach(function (l) { l === menuEl ? toggleMenu(false) : closeLayer(l); }); }
  doc.addEventListener('keydown', function (e) {
    var top = layers[layers.length - 1];
    if (!top) return;
    if (e.key === 'Escape') { e.preventDefault(); top === menuEl ? toggleMenu(false) : closeLayer(top); return; }
    if (e.key === 'Tab') {
      var scope = top === menuEl ? [$('#header')].concat([menuEl]) : [top];
      var f = [];
      scope.forEach(function (s) { f = f.concat($$(FOCUSABLE, s).filter(function (x) { return x.offsetParent !== null || x === doc.activeElement; })); });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && doc.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });

  // menu
  var menuEl = $('#menu');
  var menuBtn = $('.menu-toggle');
  function toggleMenu(open) {
    if (!menuEl) return;
    if (open === undefined) open = !menuEl.classList.contains('is-open');
    if (open) {
      root.classList.add('menu-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'Close menu');
      openLayer(menuEl, { focus: $('a', menuEl) });
    } else {
      root.classList.remove('menu-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
      closeLayer(menuEl);
    }
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { toggleMenu(); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024 && menuEl && menuEl.classList.contains('is-open')) toggleMenu(false); });

  // cart drawer
  $$('[data-cart-open]').forEach(function (b) { b.addEventListener('click', function () { if (menuEl && menuEl.classList.contains('is-open')) toggleMenu(false); openLayer(cartEl, { scrim: true }); }); });
  $$('[data-cart-close]').forEach(function (b) { b.addEventListener('click', function () { closeLayer(cartEl); }); });
  $('.scrim').addEventListener('click', function () { closeLayer(cartEl); });

  // size guide modal
  var sizeModal = $('#size-modal');
  function openSizeGuide(productId) {
    if (!sizeModal) return;
    selectSizeTab(productId === 'tshirt' ? 'tshirt' : 'hoodie');
    openLayer(sizeModal);
  }
  function selectSizeTab(id) {
    $$('[role="tab"]', sizeModal).forEach(function (t) {
      var on = t.dataset.tab === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  if (sizeModal) {
    $$('[data-modal-close]', sizeModal).forEach(function (b) { b.addEventListener('click', function () { closeLayer(sizeModal); }); });
    $$('[role="tab"]', sizeModal).forEach(function (t) {
      t.addEventListener('click', function () { selectSizeTab(t.dataset.tab); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var tabs = $$('[role="tab"]', sizeModal), i = tabs.indexOf(t), n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        selectSizeTab(n.dataset.tab); n.focus();
      });
    });
    $$('a', sizeModal).forEach(function (a) { a.addEventListener('click', function () { closeLayer(sizeModal); }); });
  }

  /* ------------------------------------------------------------------ style quiz
     Four questions picked at random from the list below. Each answer is a trait;
     the products whose traits match the most answers are recommended.
     To add a product to the quiz, give it the same traits in QUIZ_TRAITS. */
  var QUIZ_QUESTIONS = [
    { key: 'sleeves', q: 'Long sleeves or short sleeves?', a: [['long', 'Long sleeves', 'Covered arms, whatever the weather'], ['short', 'Short sleeves', 'Light and easy']] },
    { key: 'fabric', q: 'Heavy fabric or light fabric?', a: [['heavy', 'Heavy fabric', 'Thick, soft and warm'], ['light', 'Light fabric', 'Breathable on hot days']] },
    { key: 'colour', q: 'Black or white?', a: [['black', 'Black', 'Bold, with a white print'], ['white', 'White', 'Clean, with a black print']] },
    { key: 'season', q: 'When will you wear it most?', a: [['cool', 'Cool evenings', 'Autumn and winter nights'], ['warm', 'Warm days', 'Spring and summer']] },
    { key: 'hood', q: 'Hood or no hood?', a: [['yes', 'With a hood', 'For wind, rain or quiet days'], ['no', 'No hood', 'A clean neckline']] },
    { key: 'pocket', q: 'Front pocket or clean front?', a: [['yes', 'Front pocket', 'Somewhere for your hands and phone'], ['no', 'Clean front', 'Nothing but the print']] },
    { key: 'place', q: 'Pick your weekend.', a: [['mountain', 'A winter night in Faraya', 'Cold air, warm layers'], ['coast', 'A summer day in Batroun', 'Sun, sea and a light tee']] },
    { key: 'feel', q: 'How do you like it to feel?', a: [['cosy', 'Soft and cosy', 'Something to live in'], ['light', 'Light and simple', 'Throw it on and go']] }
  ];
  var QUIZ_TRAITS = {
    hoodie: { sleeves: 'long', fabric: 'heavy', colour: 'black', season: 'cool', hood: 'yes', pocket: 'yes', place: 'mountain', feel: 'cosy' },
    tshirt: { sleeves: 'short', fabric: 'light', colour: 'white', season: 'warm', hood: 'no', pocket: 'no', place: 'coast', feel: 'light' }
  };
  var quizEl = $('#quiz'), quizBody = quizEl ? $('[data-quiz-body]', quizEl) : null, quiz = null, lastQuizSet = '';
  function shuffle(list) {
    var a = list.slice();
    for (var n = a.length - 1; n > 0; n--) { var j = Math.floor(Math.random() * (n + 1)); var t = a[n]; a[n] = a[j]; a[j] = t; }
    return a;
  }
  function newQuiz() {
    var set, sig;
    do { set = shuffle(QUIZ_QUESTIONS).slice(0, 4); sig = set.map(function (q) { return q.key; }).sort().join(); }
    while (sig === lastQuizSet && QUIZ_QUESTIONS.length > 4);
    lastQuizSet = sig;
    quiz = { qs: set.map(function (q) { return { key: q.key, q: q.q, a: shuffle(q.a) }; }), step: 0, answers: [] };
  }
  function showQuizView(html, back) {
    quizBody.innerHTML = html;
    var view = quizBody.firstElementChild;
    if (back) view.classList.add('is-back');
    requestAnimationFrame(function () { requestAnimationFrame(function () { view.classList.add('is-in'); }); });
    var h = $('h2', view); if (h) h.focus({ preventScroll: true });
  }
  function renderQuizStep(back) {
    var q = quiz.qs[quiz.step], n = quiz.qs.length;
    var picked = quiz.answers[quiz.step];
    showQuizView(
      '<div class="quiz__step">' +
        '<div class="quiz__progress"><span>Question ' + (quiz.step + 1) + ' of ' + n + '</span><span class="quiz__bar" aria-hidden="true"><i style="transform:scaleX(' + ((quiz.step + 1) / n) + ')"></i></span></div>' +
        '<h2 class="quiz__q" tabindex="-1">' + esc(q.q) + '</h2>' +
        '<div class="quiz__opts">' + q.a.map(function (o, k) {
          return '<button class="quiz__opt' + (picked && picked.value === o[0] ? ' is-picked' : '') + '" type="button" data-answer="' + k + '"><span class="quiz__opt-title">' + esc(o[1]) + '</span><span class="quiz__opt-text">' + esc(o[2]) + '</span></button>';
        }).join('') + '</div>' +
        (quiz.step > 0 ? '<button class="quiz__back text-link small" type="button" data-quiz-back>Back</button>' : '') +
      '</div>', back);
  }
  function quizCard(p) {
    return '<a class="quiz__card" href="' + p.url + (p.colourKey !== colourKeys(p.id)[0] ? '?colour=' + p.colourKey : '') + '">' +
      '<span class="quiz__card-media tile--' + p.tile + '"><img src="' + p.thumb + '" alt="' + esc(p.name) + ' in ' + p.colour.toLowerCase() + '" width="600" height="750" decoding="async"></span>' +
      '<span class="quiz__card-info"><span class="quiz__card-name">' + esc(p.name) + '</span><span class="quiz__card-price">' + money(p.price) + '</span><span class="small muted">' + p.colour + ' / S to XXL</span><span class="quiz__card-cta">View ' + esc(p.name.replace('+961 ', 'the ').toLowerCase().replace('the ', 'the ')) + ' →</span></span>' +
    '</a>';
  }
  function renderQuizResult() {
    var scores = Object.keys(QUIZ_TRAITS).filter(function (id) { return PRODUCTS[id]; }).map(function (id) {
      var traits = QUIZ_TRAITS[id];
      var matched = quiz.answers.filter(function (a) { var t = traits[a.key]; return Array.isArray(t) ? t.indexOf(a.value) > -1 : t === a.value; });
      return { id: id, score: matched.length, matched: matched };
    }).sort(function (x, y) { return y.score - x.score; });
    var best = scores[0].score;
    var colourAnswer = quiz.answers.filter(function (a) { return a.key === 'colour'; })[0];
    var pickedColour = colourAnswer ? colourAnswer.value : null;
    var winners = scores.filter(function (s) { return s.score === best; });
    var tie = winners.length > 1;
    var title = tie ? 'You are a 50/50.' : 'Your match: ' + PRODUCTS[winners[0].id].name + (colourKeys(winners[0].id).length > 1 && pickedColour ? ' in ' + pv(winners[0].id, pickedColour).colour.toLowerCase() : '') + '.';
    var text = tie
      ? 'Your answers fit both pieces equally. Start with either, or wear one of each.'
      : 'It matches ' + best + ' of your ' + quiz.answers.length + ' answers: ' + winners[0].matched.map(function (a) { return a.label.charAt(0).toLowerCase() + a.label.slice(1); }).join(', ') + '.';
    showQuizView(
      '<div class="quiz__result">' +
        '<p class="quiz__progress"><span>Your result</span></p>' +
        '<h2 class="quiz__q" tabindex="-1">' + esc(title) + '</h2>' +
        '<p class="small muted">' + esc(text) + '</p>' +
        '<div class="quiz__cards' + (tie ? ' is-pair' : '') + '">' + winners.map(function (w) { return quizCard(pv(w.id, pickedColour)); }).join('') + '</div>' +
        '<button class="quiz__back text-link small" type="button" data-quiz-restart>Take the quiz again (new questions)</button>' +
      '</div>');
  }
  if (quizEl) {
    doc.addEventListener('click', function (e) {
      var t = e.target.closest('[data-open-quiz]');
      if (!t) return;
      newQuiz();
      renderQuizStep();
      openLayer(quizEl, { focus: $('.quiz__q', quizBody) });
    });
    $$('[data-quiz-close]', quizEl).forEach(function (b) { b.addEventListener('click', function () { closeLayer(quizEl); }); });
    quizBody.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-answer]');
      if (opt && quiz && !quiz.busy) {
        var q = quiz.qs[quiz.step], o = q.a[parseInt(opt.getAttribute('data-answer'), 10)];
        quiz.answers[quiz.step] = { key: q.key, value: o[0], label: o[1] };
        $$('.quiz__opt', quizBody).forEach(function (b) { b.classList.toggle('is-picked', b === opt); });
        quiz.busy = true;
        setTimeout(function () {
          quiz.busy = false;
          quiz.step++;
          if (quiz.step < quiz.qs.length) renderQuizStep(); else renderQuizResult();
        }, reduce ? 0 : 260);
        return;
      }
      if (e.target.closest('[data-quiz-back]') && quiz && quiz.step > 0) { quiz.step--; renderQuizStep(true); return; }
      if (e.target.closest('[data-quiz-restart]')) { newQuiz(); renderQuizStep(); return; }
      if (e.target.closest('.quiz__card')) closeLayer(quizEl);
    });
  }

  // lightbox
  var lb = $('#lightbox'), lbState = { p: null, i: 0 };
  function lbShow(i) {
    var v = lbState.p.views;
    lbState.i = (i + v.length) % v.length;
    var img = $('.lightbox__img', lb);
    $('.lightbox__stage', lb).classList.remove('is-zoomed');
    img.style.opacity = '0';
    setTimeout(function () {
      img.src = v[lbState.i].src;
      img.alt = v[lbState.i].alt;
      img.style.opacity = '1';
    }, reduce ? 0 : 150);
    $('.lightbox__count', lb).textContent = (lbState.i + 1) + ' / ' + v.length;
  }
  function openLightbox(p, i) {
    if (!lb) return;
    lbState.p = p;
    lb.dataset.theme = p.tile;
    var img = $('.lightbox__img', lb);
    img.src = p.views[i].src; img.alt = p.views[i].alt; lbState.i = i;
    $('.lightbox__count', lb).textContent = (i + 1) + ' / ' + p.views.length;
    $('.lightbox__stage', lb).classList.remove('is-zoomed');
    openLayer(lb, { focus: $('[data-lb-close]', lb) });
  }
  if (lb) {
    $('[data-lb-close]', lb).addEventListener('click', function () { closeLayer(lb); });
    $('[data-lb-prev]', lb).addEventListener('click', function () { lbShow(lbState.i - 1); });
    $('[data-lb-next]', lb).addEventListener('click', function () { lbShow(lbState.i + 1); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') lbShow(lbState.i + 1); if (e.key === 'ArrowLeft') lbShow(lbState.i - 1); });
    var stage = $('.lightbox__stage', lb), lbImg = $('.lightbox__img', lb), down = null, moved = false;
    var setOrigin = function (e) {
      var r = lbImg.getBoundingClientRect();
      var x = Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100));
      var y = Math.min(100, Math.max(0, (e.clientY - r.top) / r.height * 100));
      lbImg.style.transformOrigin = x + '% ' + y + '%';
    };
    stage.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; moved = false; });
    stage.addEventListener('pointermove', function (e) {
      if (down && Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 6) moved = true;
      if (stage.classList.contains('is-zoomed') && (e.pointerType === 'mouse' || down)) setOrigin(e);
    });
    stage.addEventListener('pointerup', function (e) {
      if (!moved) {
        if (!stage.classList.contains('is-zoomed')) setOrigin(e);
        stage.classList.toggle('is-zoomed');
      }
      down = null;
    });
    stage.addEventListener('pointercancel', function () { down = null; });
    // swipe between views when not zoomed
    var sx = null;
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (sx === null || stage.classList.contains('is-zoomed')) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) { moved = true; lbShow(lbState.i + (dx < 0 ? 1 : -1)); }
    });
  }

  /* ------------------------------------------------------------------ header, progress, floating button */
  var header = $('#header'), progressBar = $('.progress span'), fab = $('.fab');
  var themed = [], ticking = false;
  function collectThemed() { themed = $$('main > [data-theme], main > * > [data-theme].section, .footer'); avoidEls = $$('[data-fab-avoid]'); }
  function updateChrome() {
    ticking = false;
    var y = window.scrollY || root.scrollTop || 0;
    var vh = window.innerHeight;
    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
      var theme = 'light';
      if (root.classList.contains('menu-open')) theme = 'dark';
      else {
        var probe = header.offsetHeight / 2;
        for (var i = 0; i < themed.length; i++) {
          var r = themed[i].getBoundingClientRect();
          if (r.top <= probe && r.bottom > probe) theme = themed[i].getAttribute('data-theme') || theme;
        }
      }
      if (header.getAttribute('data-theme') !== theme) header.setAttribute('data-theme', theme);
    }
    if (progressBar) {
      var max = root.scrollHeight - vh;
      progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    }
    if (fab) checkFab(vh);
  }
  // The floating button checks what sits under it at most every 120 ms, plus once
  // when scrolling stops, instead of on every frame.
  var fabLast = 0, fabTimer = null, avoidEls = [];
  function checkFab(vh) {
    clearTimeout(fabTimer);
    if (layers.length) { fab.classList.add('is-hidden'); return; }
    var now = Date.now();
    if (now - fabLast < 120) { fabTimer = setTimeout(function () { checkFab(window.innerHeight); }, 140); return; }
    fabLast = now;
    {
      var hide = layers.length > 0;
      if (!hide) {
        var fr = fab.getBoundingClientRect();
        var band = fr.top - 16;
        avoidEls.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.height && r.top < vh && r.bottom > band) hide = true;
        });
        // never cover a link, button or field
        if (!hide && doc.elementsFromPoint) {
          var pts = [[fr.left - 4, fr.top + 4], [fr.left - 4, fr.bottom - 4], [fr.left + fr.width / 2, fr.top - 4], [fr.left + fr.width / 2, fr.top + fr.height / 2], [fr.right - 4, fr.bottom - 4]];
          for (var k = 0; k < pts.length && !hide; k++) {
            var stack = doc.elementsFromPoint(pts[k][0], pts[k][1]);
            for (var s = 0; s < stack.length; s++) {
              var el2 = stack[s];
              if (el2 === fab || fab.contains(el2) || el2.closest('.cursor')) continue;
              if (el2.closest('a, button, input, textarea, select, label, [role="tab"]')) hide = true;
              break;
            }
          }
        }
      }
      fab.classList.toggle('is-hidden', hide);
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(updateChrome); } }
  if (lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  function setFabMessage(route) {
    if (!fab) return;
    var p = route === 'hoodie' ? pv('hoodie') : route === 't-shirt' ? pv('tshirt') : null;
    fab.href = waLink(p ? 'Hi +961, I have a question about the ' + p.waName + '.' : 'Hi +961, I have a question.');
  }

  /* ------------------------------------------------------------------ custom cursor */
  var cursor = $('.cursor');
  if (cursor && G && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    root.classList.add('has-cursor');
    var xTo = G.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    var yTo = G.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    var cx = 0, cy = 0, cPending = false;
    var checkUnder = function () {
      cPending = false;
      var el = doc.elementFromPoint(cx, cy);
      if (!el) return;
      var t = el.closest('[data-theme]:not(.header):not(.cursor)');
      var hdr = el.closest('.header');
      var theme = hdr ? hdr.getAttribute('data-theme') : (t ? t.getAttribute('data-theme') : 'light');
      if (el.closest('.tile--dark')) theme = 'dark';
      else if (el.closest('.tile--light')) theme = 'light';
      cursor.setAttribute('data-on', theme);
      var text = el.closest('input:not([type="radio"]), textarea');
      cursor.classList.toggle('is-text', !!text);
      cursor.classList.toggle('is-hover', !text && !!el.closest('a, button, label, [role="tab"], .lightbox__stage'));
    };
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      cx = e.clientX; cy = e.clientY;
      xTo(cx); yTo(cy);
      cursor.classList.add('is-visible');
      if (!cPending) { cPending = true; requestAnimationFrame(checkUnder); }
    }, { passive: true });
    window.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); });
    doc.addEventListener('mouseleave', function () { cursor.classList.remove('is-visible'); });
    if (lenis) lenis.on('scroll', function () { if (!cPending) { cPending = true; requestAnimationFrame(checkUnder); } });
  }

  /* ------------------------------------------------------------------ text splitting */
  function splitLines(el) {
    if (!el) return [];
    if (el.dataset.splitDone) return $$('.split-line__in', el);
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ').map(function (w) { return '<span class="split-w" style="display:inline-block">' + esc(w) + '</span>'; }).join(' ');
    var lines = [], lastTop = null;
    $$('.split-w', el).forEach(function (s) {
      var t = s.offsetTop;
      if (lastTop === null || Math.abs(t - lastTop) > 4) { lines.push([]); lastTop = t; }
      lines[lines.length - 1].push(s.textContent);
    });
    el.innerHTML = lines.map(function (l) {
      return '<span class="split-line" aria-hidden="true"><span class="split-line__in">' + l.map(esc).join(' ') + '</span></span>';
    }).join('');
    el.dataset.splitDone = '1';
    return $$('.split-line__in', el);
  }
  function splitChars(el) {
    if (!el) return [];
    if (el.dataset.splitDone) return $$('.split-char__in', el);
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = Array.prototype.map.call(text, function (c) {
      return '<span class="split-char" aria-hidden="true"><span class="split-char__in">' + (c === ' ' ? '&nbsp;' : esc(c)) + '</span></span>';
    }).join('');
    el.dataset.splitDone = '1';
    return $$('.split-char__in', el);
  }

  /* ------------------------------------------------------------------ page features */
  var mainEl = $('main');
  var pageAC = null;
  var firstLoad = true;

  function introDelay() { return firstLoad && root.classList.contains('has-intro') ? 1.15 : 0.1; }

  function maskTween(m, opts) {
    var inn = $('.mask__in', m), img = $('.mask__img', m);
    if (!inn || !img) return null;
    var tl = G.timeline(opts || {});
    tl.fromTo(inn, { yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: EASE_IO }, 0)
      .fromTo(img, { yPercent: -100, scale: 1.15 }, { yPercent: 0, scale: 1, duration: 0.8, ease: EASE_IO }, 0);
    return tl;
  }

  function initMotion() {
    if (!G || !ST) return;
    var scope = mainEl;
    var hero = $('.hero', scope);

    // headlines, line by line
    $$('[data-split]', scope).forEach(function (el) {
      if (hero && hero.contains(el)) return;
      var lines = splitLines(el);
      G.from(lines, { yPercent: 105, duration: 0.8, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
    // letter by letter
    $$('[data-split-chars]', scope).forEach(function (el) {
      var chars = splitChars(el);
      G.from(chars, { yPercent: 110, duration: 0.8, ease: EASE, stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
    // fade up
    $$('[data-reveal]', scope).forEach(function (el) {
      if (hero && hero.contains(el)) return;
      G.from(el, { y: 32, opacity: 0, duration: 0.8, ease: EASE, scrollTrigger: { trigger: el, start: 'top 92%' } });
    });
    // staggered groups
    $$('[data-reveal-group]', scope).forEach(function (g) {
      var items = $$('[data-reveal-item]', g);
      if (!items.length) return;
      G.from(items, { y: 40, opacity: 0, duration: 0.8, ease: EASE, stagger: 0.1, scrollTrigger: { trigger: g, start: 'top 90%' } });
    });
    // image wipes
    $$('[data-mask]', scope).forEach(function (m) {
      if (hero && hero.contains(m)) return;
      maskTween(m, { scrollTrigger: { trigger: m, start: 'top 92%' } });
    });

    // hero
    if (hero) {
      var lines = splitLines($('.hero__title', hero));
      var frame = $('[data-hero-media]', hero), heroImg = $('.hero__img', hero);
      var tl = G.timeline({ delay: introDelay() });
      tl.from(lines, { yPercent: 105, duration: 0.8, ease: EASE, stagger: 0.1 }, 0.1);
      if (frame) tl.add(maskTween(frame), 0);
      tl.from($$('[data-hero-fade]', hero), { y: 24, opacity: 0, duration: 0.7, ease: EASE, stagger: 0.08 }, 0.35);
      if (heroImg) G.fromTo(heroImg, { yPercent: -3, scale: 1.1 }, { yPercent: 4, scale: 1.14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }

    // giant +961 statement
    $$('[data-statement]', scope).forEach(function (el) {
      G.fromTo(el, { xPercent: -14, scale: 0.86 }, { xPercent: 12, scale: 1.08, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // parallax helpers
    $$('[data-parallax]', scope).forEach(function (el) {
      var amt = parseFloat(el.getAttribute('data-parallax')) || 10;
      G.fromTo(el, { yPercent: -amt / 2 }, { yPercent: amt / 2, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // horizontal drift (about page cities)
    $$('[data-drift]', scope).forEach(function (el) {
      G.fromTo(el, { xPercent: 0 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // about hero type
    $$('[data-rise]', scope).forEach(function (el) {
      G.fromTo(el, { yPercent: 0 }, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top top', end: 'bottom top', scrub: true } });
    });
  }

  function initAccordions(sig) {
    var t = null;
    $$('.acc__btn', mainEl).forEach(function (b) {
      b.addEventListener('click', function () {
        var acc = b.closest('.acc');
        var open = !acc.classList.contains('is-open');
        acc.classList.toggle('is-open', open);
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        clearTimeout(t);
        t = setTimeout(function () { if (ST) ST.refresh(); if (lenis) lenis.resize(); }, 560);
      }, sig);
    });
  }

  function initSizeGuideLinks(sig) {
    $$('[data-open-size]', mainEl).forEach(function (b) {
      b.addEventListener('click', function () { openSizeGuide(b.getAttribute('data-open-size')); }, sig);
    });
  }

  function morph(btn) {
    btn.classList.add('is-done');
    setTimeout(function () { btn.classList.remove('is-done'); }, 1800);
  }

  function initProduct(sig) {
    var box = $('[data-product]', mainEl);
    if (!box) return;
    var id = box.getAttribute('data-product');
    var asked = null;
    try { asked = new URLSearchParams(location.search).get('colour'); } catch (e) { asked = null; }
    var colourRadios = $$('input[name="colour"]', box);
    var colour = validColour(id, asked || (colourRadios.filter(function (r) { return r.checked; })[0] || {}).value);
    var p = pv(id, colour);
    var opts = $('.sizes__opts', box), err = $('.sizes__error', box);
    var radios = $$('input[name="size"]', box);
    var buy = $('[data-buy-now]', box), wa = $('[data-wa-product]', box), add = $('[data-add]', box);
    var size = null;
    radios.forEach(function (r) { if (r.checked) size = r.value; });
    function sync() { wa.href = waLink("Hi +961, I'd like to order the " + p.waName + (size ? ', size ' + size : '') + ' (' + money(p.price) + ').'); }

    // switching colour swaps the photos, the text and what goes in the bag
    function showColour(key, animate) {
      colour = validColour(id, key);
      p = pv(id, colour);
      colourRadios.forEach(function (r) { r.checked = r.value === colour; });
      $$('[data-colour-name]', box).forEach(function (el) { el.textContent = p.colour; });
      var desc = $('[data-desc]', box); if (desc) desc.textContent = p.desc;
      var print = $('[data-print]', box); if (print) print.textContent = p.print;
      $$('.pdp__slide', box).forEach(function (slide, n) {
        var img = $('img', slide), v = p.views[n];
        slide.classList.remove('tile--light', 'tile--dark');
        slide.classList.add('tile--' + p.tile);
        var swap = function () {
          img.src = v.src;
          img.srcset = v.src600 + ' 600w, ' + v.src + ' 1000w';
          img.alt = v.alt;
          img.style.opacity = '';
        };
        if (animate && !reduce) { img.style.opacity = '0'; setTimeout(swap, 180); } else swap();
      });
      sync();
    }
    colourRadios.forEach(function (r) {
      r.addEventListener('change', function () {
        showColour(r.value, true);
        try { history.replaceState(history.state, '', location.pathname + (colour === colourKeys(id)[0] ? '' : '?colour=' + colour)); } catch (e) { /* ignore */ }
      }, sig);
    });
    if (colourRadios.length) showColour(colour, false);

    function hideErr() { err.classList.remove('is-visible'); setTimeout(function () { if (!err.classList.contains('is-visible')) err.hidden = true; }, 300); }
    radios.forEach(function (r) { r.addEventListener('change', function () { size = r.value; hideErr(); sync(); }, sig); });
    function need() {
      if (size) return true;
      err.hidden = false;
      requestAnimationFrame(function () { err.classList.add('is-visible'); });
      opts.classList.remove('is-shaking'); void opts.offsetWidth; opts.classList.add('is-shaking');
      var r = opts.getBoundingClientRect();
      if (r.top < headerOffset() + 16 || r.bottom > window.innerHeight - 120) scrollToEl(opts, false, 96);
      setTimeout(function () { if (radios[0]) radios[0].focus({ preventScroll: true }); }, 10);
      return false;
    }
    opts.addEventListener('animationend', function () { opts.classList.remove('is-shaking'); }, sig);
    wa.addEventListener('click', function (e) { if (!need()) e.preventDefault(); }, sig);
    buy.addEventListener('click', function () {
      if (!need()) return;
      Cart.ensure(id, colour, size);
      morph(buy); bounceCart();
      setTimeout(function () { go(parseHref('checkout.html')); }, reduce ? 0 : 700);
    }, sig);
    add.addEventListener('click', function () {
      if (!need()) return;
      Cart.add(id, colour, size, 1);
      bounceCart();
      var label = $('.buy__add-label', add), ico = $('.buy__add-icon', add);
      add.classList.remove('is-added'); void add.offsetWidth; add.classList.add('is-added');
      ico.innerHTML = ICON.check;
      label.textContent = 'Added to bag: ' + p.colour.toLowerCase() + ', size ' + size;
      clearTimeout(add._t);
      add._t = setTimeout(function () { label.textContent = 'Add to bag and keep shopping'; ico.innerHTML = ICON.plus; add.classList.remove('is-added'); }, 2200);
    }, sig);
    sync();

    // mobile gallery position
    var slides = $('.pdp__slides', box), dots = $$('.pdp__dots span', box), count = $('[data-slide-count]', box);
    if (slides) {
      slides.addEventListener('scroll', function () {
        var i = Math.round(slides.scrollLeft / Math.max(1, slides.clientWidth));
        dots.forEach(function (d, j) { d.classList.toggle('is-active', i === j); });
        if (count) count.textContent = (i + 1) + ' / ' + p.views.length;
      }, { passive: true, signal: sig.signal });
    }
    $$('[data-zoom]', box).forEach(function (b) {
      b.addEventListener('click', function () { openLightbox(p, parseInt(b.getAttribute('data-zoom'), 10) || 0); }, sig);
    });
  }

  /* checkout */
  var ORDER_ENDPOINT = 'https://api.web3forms.com/submit';
  var stripeLoad = null;
  function loadStripe() {
    if (stripeLoad) return stripeLoad;
    stripeLoad = new Promise(function (res, rej) {
      var make = function () { try { res(window.Stripe(CONFIG.stripePublishableKey)); } catch (e) { stripeLoad = null; rej(e); } };
      if (window.Stripe) { make(); return; }
      var s = doc.createElement('script');
      s.src = 'https://js.stripe.com/endive/stripe.js';
      s.async = true;
      s.onload = function () { if (window.Stripe) make(); else { stripeLoad = null; rej(new Error('Stripe unavailable')); } };
      s.onerror = function () { stripeLoad = null; rej(new Error('Stripe failed to load')); };
      doc.head.appendChild(s);
    });
    return stripeLoad;
  }

  function initCheckout(sig) {
    var co = $('[data-checkout]', mainEl);
    if (!co) return;
    var form = $('#checkout-form', co), empty = $('[data-co-empty]', co), layout = $('[data-co-layout]', co);
    var linesEl = $('[data-summary-lines]', co);
    var submitBtn = $('[data-place-order]', co), note = $('[data-submit-note]', co);
    var cardBox = $('[data-card]', co), cardMount = $('[data-card-mount]', co), cardMsg = $('[data-card-msg]', co);
    var notice = $('[data-send-notice]', co), waAlt = $('[data-wa-order]', co);
    var dest = 'lebanon', sending = false, lastOrder = null;
    var cardInput = $('#pay-card', co), quoteInput = $('#pay-quote', co);
    var cardOn = !!CONFIG.stripePublishableKey;
    function showPaymentChoices() {
      var abroad = dest !== 'lebanon';
      $('#pay-cod', co).closest('.choice').hidden = abroad;
      if (cardInput) cardInput.closest('.choice').hidden = abroad || !cardOn;
      quoteInput.closest('.choice').hidden = !abroad;
      var current = form.querySelector('input[name="payment"]:checked');
      if (abroad) quoteInput.checked = true;
      else if (!current || current.closest('.choice').hidden) $('#pay-cod', co).checked = true;
    }

    function fee() { return dest === 'lebanon' ? CONFIG.deliveryLebanon : null; }
    function render() {
      if (!doc.contains(layout)) return;
      var n = Cart.count();
      empty.hidden = n > 0; layout.hidden = n === 0;
      if (!n) return;
      linesEl.innerHTML = Cart.items.map(function (i) {
        var p = pv(i.id, i.colour);
        return '<li class="sline"><div class="sline__media tile--' + p.tile + '"><img src="' + p.thumb + '" alt="' + esc(p.name) + ' in ' + p.colour.toLowerCase() + '" width="600" height="750" loading="lazy" decoding="async"><span class="sline__qty">' + i.qty + '</span></div>' +
          '<div><p class="sline__name">' + esc(p.name) + '</p><p class="sline__meta">' + p.colour + ' / ' + i.size + ' / Qty ' + i.qty + '</p></div>' +
          '<p class="sline__price">' + money(p.price * i.qty) + '</p></li>';
      }).join('');
      var f = fee();
      $('[data-co-subtotal]', co).textContent = money(Cart.subtotal());
      $('[data-co-delivery]', co).textContent = f === null ? 'Quoted after you order' : money(f);
      $('[data-co-total]', co).textContent = money(Cart.subtotal() + (f || 0));
      $('[data-co-total-note]', co).hidden = f !== null;
      $$('[data-co-count]', co).forEach(function (el) { el.textContent = n + (n === 1 ? ' item' : ' items'); });
    }
    render();
    doc.addEventListener('961:cart', function () {
      render();
      if (cardCheckout && doc.contains(form) && Cart.count()) { resetCard(); cardNote('Your bag changed. Continue to payment again.'); }
    }, sig);

    function field(name) { return form.elements[name]; }
    function payment() { var r = form.querySelector('input[name="payment"]:checked'); return r ? r.value : null; }
    function payLabel() { var r = form.querySelector('input[name="payment"]:checked'); return r ? r.getAttribute('data-label') : ''; }
    function paysByCard() { return payment() === 'card' && dest === 'lebanon'; }

    // the button and note under the form follow the payment method
    var NOTES = {
      cod: 'You pay in cash when your order arrives. We call you to arrange delivery.',
      card: 'Next, enter your Visa or Mastercard details in the secure card form. Your order is confirmed as soon as the payment goes through.',
      intl: 'Nothing is charged now. We contact you with the shipping cost and how to pay.'
    };
    function submitLabel() { return paysByCard() ? 'Continue to payment' : 'Place order'; }
    function updateSubmit() {
      if (!sending) $('.btn__label', submitBtn).textContent = submitLabel();
      note.textContent = dest !== 'lebanon' ? NOTES.intl : (NOTES[payment()] || NOTES.cod);
      notice.hidden = true;
      cardNote('');
    }

    // destination
    var countryField = $('[data-country-field]', co);
    showPaymentChoices();
    $$('input[name="destination"]', co).forEach(function (r) {
      r.addEventListener('change', function () {
        dest = r.value;
        countryField.hidden = dest === 'lebanon';
        showPaymentChoices();
        $('[data-city-label]', co).textContent = dest === 'lebanon' ? 'City / area' : 'City';
        render();
        updateSubmit();
      }, sig);
    });
    var billingFields = $('[data-billing-fields]', co);
    $$('input[name="billing"]', co).forEach(function (r) {
      r.addEventListener('change', function () {
        billingFields.hidden = r.value !== 'different';
        if (!billingFields.hidden) setTimeout(function () { field('billName').focus({ preventScroll: true }); }, 50);
        if (ST) ST.refresh();
      }, sig);
    });
    $$('input[name="payment"]', co).forEach(function (r) {
      r.addEventListener('change', function () { $('[data-pay-error]', co).hidden = true; updateSubmit(); }, sig);
    });

    // validation
    function setInvalid(input, bad) {
      var f = input.closest('.field');
      if (f) f.classList.toggle('is-invalid', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    }
    function validate() {
      var bad = [];
      var checks = [
        ['fullname', function (v) { return v.trim().length >= 2; }],
        ['phone', function (v) { return v.replace(/\D/g, '').length >= 7; }],
        ['email', function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }],
        ['city', function (v) { return v.trim().length >= 2; }],
        ['address', function (v) { return v.trim().length >= 6; }]
      ];
      if (dest !== 'lebanon') checks.push(['country', function (v) { return v.trim().length >= 2; }]);
      checks.forEach(function (c) {
        var el = field(c[0]); var ok = c[1](el.value);
        setInvalid(el, !ok); if (!ok) bad.push(el);
      });
      var pay = form.querySelector('input[name="payment"]:checked');
      $('[data-pay-error]', co).hidden = !!pay;
      if (!pay) bad.push($('input[name="payment"]:not(:disabled)', co));
      return bad;
    }
    function check() {
      var bad = validate();
      if (!bad.length) return true;
      var first = bad[0];
      scrollToEl(first.closest('.field') || first.closest('fieldset') || first, false, 48);
      setTimeout(function () { first.focus({ preventScroll: true }); }, reduce ? 0 : 500);
      return false;
    }
    ['fullname', 'phone', 'email', 'city', 'address', 'country'].forEach(function (n) {
      var el = field(n);
      if (el) el.addEventListener('input', function () { if (el.closest('.field').classList.contains('is-invalid')) validate(); }, sig);
    });

    // the order
    function orderRef() { return '961-' + Date.now().toString(36).slice(-5).toUpperCase(); }
    var checkoutRef = orderRef();
    function billingText() {
      var r = form.querySelector('input[name="billing"]:checked');
      if (!r || r.value === 'same') return 'Same as shipping address';
      var parts = ['billName', 'billAddress', 'billCity', 'billCountry'].map(function (n) { return field(n).value.trim().replace(/\s*\n\s*/g, ', '); }).filter(Boolean);
      return parts.length ? parts.join(', ') : 'Different address (not filled in)';
    }
    function collect() {
      var f = fee();
      return {
        ref: checkoutRef,
        name: field('fullname').value.trim(),
        phone: field('phone').value.trim(),
        email: field('email').value.trim(),
        intl: dest !== 'lebanon',
        dest: dest === 'lebanon' ? 'Lebanon' : field('country').value.trim(),
        city: field('city').value.trim(),
        address: field('address').value.trim().replace(/\s*\n\s*/g, ', '),
        notes: field('notes').value.trim().replace(/\s*\n\s*/g, ' '),
        billing: billingText(),
        payment: payment(), payLabel: payLabel(),
        items: Cart.items.map(function (i) { return { id: i.id, colour: i.colour, size: i.size, qty: i.qty }; }),
        subtotal: Cart.subtotal(), fee: f, total: Cart.subtotal() + (f || 0)
      };
    }
    function itemLines(o) {
      return o.items.map(function (i) { var p = pv(i.id, i.colour); return p.waName + ', size ' + i.size + ', quantity ' + i.qty + ': ' + money(p.price * i.qty); });
    }
    function totalText(o) { return money(o.total) + (o.fee === null ? ' + shipping' : ''); }
    function waMessage(o) {
      var out = [
        "Hi +961, I'd like to place an order.", '',
        'Order: ' + o.ref,
        itemLines(o).map(function (l) { return '- ' + l; }).join('\n'),
        'Subtotal: ' + money(o.subtotal),
        'Delivery: ' + (o.fee === null ? 'to be confirmed' : money(o.fee)),
        'Total: ' + totalText(o), '',
        'Name: ' + o.name,
        'Phone: ' + o.phone,
        'Delivering to: ' + o.dest,
        (o.intl ? 'City: ' : 'City / area: ') + o.city,
        'Address: ' + o.address,
        'Payment: ' + o.payLabel
      ];
      if (o.email) out.push('Email: ' + o.email);
      if (o.notes) out.push('Notes: ' + o.notes);
      if (o.billing && o.billing !== 'Same as shipping address') out.push('Billing address: ' + o.billing);
      return out.join('\n');
    }
    function statusFor(o) {
      if (o.intl) return 'Nothing charged yet. Send the shipping quote and how to pay';
      if (o.payment === 'cod') return 'Cash on delivery, collect ' + money(o.total);
      if (o.payment === 'card') return 'Card (Stripe), PAID ' + money(o.total) + (o.sessionId ? '. Stripe session ' + o.sessionId : '');
      return o.payLabel;
    }
    function sendOrder(o, status, subject) {
      var bot = form.elements.botcheck;
      if (bot && bot.checked) return Promise.resolve();          // spam bots tick the hidden box
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
      // The email lists the order in the same order as the checkout form
      var body = {
        access_key: CONFIG.web3formsKey,
        subject: subject || 'New +961 order ' + o.ref + ': ' + totalText(o) + ', ' + o.payLabel,
        from_name: '+961 Website',
        botcheck: false,
        'Order number': o.ref,
        'Order summary': o.items.map(function (i) {
          var p = pv(i.id, i.colour);
          return i.qty + ' x ' + p.name + ' (' + p.colour + ', size ' + i.size + '): ' + money(p.price * i.qty);
        }).join(' | '),
        'Subtotal': money(o.subtotal),
        'Delivery fee': o.fee === null ? 'To be quoted (outside Lebanon)' : money(o.fee),
        'Total': totalText(o),
        'Full name': o.name,
        'Phone number': o.phone,
        'Email': o.email || 'Not given',
        'Delivery': o.intl ? 'Outside Lebanon: ' + o.dest : 'Lebanon',
        'City / area': o.city,
        'Full address': o.address,
        'Order notes': o.notes || 'None',
        'Payment': status,
        'Billing address': o.billing
      };
      if (o.email) body.replyto = o.email;                       // press Reply to answer the customer
      // Sent as a plain form, so browsers send it straight away without an extra check
      var data = new FormData();
      Object.keys(body).forEach(function (k) { data.append(k, body[k] === false ? '' : String(body[k])); });
      return fetch(ORDER_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || !(j.success === true || j.success === 'true')) {
            throw new Error(j.message || 'HTTP ' + r.status);
          }
        });
      }).then(function () { clearTimeout(timer); }, function (err) { clearTimeout(timer); throw err; });
    }

    function setSending(on, label) {
      sending = on;
      submitBtn.disabled = on;
      submitBtn.classList.toggle('is-loading', on);
      $('.btn__label', submitBtn).textContent = on ? (label || 'Placing order') : submitLabel();
    }
    function showNotice(text, o) {
      lastOrder = o;
      notice.innerHTML = '<p>' + esc(text) + '</p><a class="btn btn--wa btn--sm" href="' + esc(waLink(waMessage(o))) + '" target="_blank" rel="noopener" data-notice-wa><span class="btn__label">' + ICON.wa + 'Send on WhatsApp</span></a>';
      notice.hidden = false;
      scrollToEl(notice, false, 96);
    }
    notice.addEventListener('click', function (e) {
      if (e.target.closest('[data-notice-wa]') && lastOrder) { var o = lastOrder; setTimeout(function () { showConfirmation(o, 'whatsapp'); }, 60); }
    }, sig);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending || cardCheckout) return;
      notice.hidden = true;
      if (!check()) return;
      var o = collect();
      if (paysByCard()) { startCard(o); return; }
      var kind = o.intl ? 'intl' : o.payment;
      if (EMBEDDED) { showConfirmation(o, kind, { preview: true }); return; }
      if (!CONFIG.web3formsKey) { showNotice('Online orders are not switched on yet. Send this order on WhatsApp and we will confirm it there.', o); return; }
      setSending(true);
      sendOrder(o, statusFor(o)).then(function () { showConfirmation(o, kind); }, function (err) {
        setSending(false);
        if (window.console) console.warn('Order email failed:', err && err.message);
        showNotice('We could not send your order. Check your connection and try again, or send it on WhatsApp instead.', o);
      });
    }, sig);

    // WhatsApp stays available as a second option
    waAlt.addEventListener('click', function (e) {
      if (!check()) { e.preventDefault(); return; }
      var o = collect();
      waAlt.href = waLink(waMessage(o));
      setTimeout(function () { showConfirmation(o, 'whatsapp'); }, 60);
    }, sig);

    // card payment with Stripe: the secure card form opens inside the checkout
    var cardCheckout = null, cardOrder = null;
    function cardNote(text) { cardMsg.textContent = text; cardMsg.hidden = !text; if (text) cardBox.hidden = false; }
    function lockForm(on) {
      $$('fieldset', form).forEach(function (f) { f.disabled = on; });
      form.classList.toggle('is-locked', on);
    }
    function resetCard() {
      if (cardCheckout) { try { cardCheckout.destroy(); } catch (e) { /* already gone */ } }
      cardCheckout = null;
      cardMount.innerHTML = '';
      cardBox.hidden = true;
      submitBtn.hidden = false;
      note.hidden = false;
      lockForm(false);
    }
    $('[data-card-edit]', co).addEventListener('click', function () { resetCard(); field('fullname').focus(); }, sig);

    function startCard(o) {
      if (EMBEDDED || !CONFIG.stripePublishableKey) {
        cardNote(EMBEDDED ? 'Card payments are not connected yet, so this preview cannot open the Stripe card form. On your published site, it opens here as soon as your Stripe account is connected.' : 'Card payments are not available right now. Choose another payment method.');
        $('[data-card-edit]', co).hidden = true;
        return;
      }
      cardOrder = o;
      setSending(true, 'Loading payment');
      var secret = fetch(CONFIG.stripeCheckoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: o.items, order: { ref: o.ref, name: o.name, phone: o.phone, email: o.email, city: o.city, address: o.address, notes: o.notes } })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || !j.clientSecret) throw new Error(j.error || 'HTTP ' + r.status);
          o.sessionId = j.id;
          return j.clientSecret;
        });
      });
      Promise.all([loadStripe(), secret]).then(function (res) {
        var stripe = res[0], clientSecret = res[1];
        var create = stripe.createEmbeddedCheckoutPage || stripe.initEmbeddedCheckout;
        if (!create) throw new Error('Embedded checkout unavailable');
        return create.call(stripe, { fetchClientSecret: function () { return Promise.resolve(clientSecret); }, onComplete: onCardComplete });
      }).then(function (checkout) {
        setSending(false);
        cardCheckout = checkout;
        submitBtn.hidden = true;
        $('[data-card-edit]', co).hidden = false;
        cardNote('');
        cardBox.hidden = false;
        note.hidden = true;
        lockForm(true);
        checkout.mount(cardMount);
        scrollToEl(cardBox, false, 24);
      }).catch(function () {
        setSending(false);
        showNotice('The card payment could not start. Try again, or choose another payment method.', o);
      });
    }

    function onCardComplete() {
      var o = cardOrder;
      var done = function () { showConfirmation(o, 'card'); };
      if (!CONFIG.web3formsKey) { o.mailFailed = true; done(); return; }
      sendOrder(o, statusFor(o)).then(done, function () { o.mailFailed = true; done(); });
    }

    function showConfirmation(o, kind, opts) {
      var node = $('#confirm-template', co).content.cloneNode(true);
      var first = o.name.split(/\s+/)[0];
      var copy = {
        cod: ['Thank you, ' + first + '.', 'We have your order. We will call you on ' + o.phone + ' to arrange delivery, and you pay ' + money(o.total) + ' in cash when it arrives.'],
        card: ['Thank you, ' + first + '.', 'Your card payment of ' + money(o.total) + ' went through and your order is confirmed. We will call you on ' + o.phone + ' to arrange delivery.'],
        intl: ['Thank you, ' + first + '.', 'We have your order. Nothing has been charged. We will contact you on ' + o.phone + ' with the shipping cost to ' + o.dest + ' and how to pay.'],
        whatsapp: ['Thank you, ' + first + '.', 'Your order is ready in WhatsApp. Press send to confirm it, and we will reply with your delivery details.']
      }[kind] || ['Thank you, ' + first + '.', 'We have your order.'];
      $('[data-confirm-title]', node).textContent = copy[0];
      $('[data-confirm-text]', node).textContent = copy[1];
      $('[data-confirm-ref]', node).textContent = o.ref;
      $('[data-confirm-help]', node).href = waLink('Hi +961, I have a question about order ' + o.ref + '.');
      if (kind === 'card' && o.mailFailed) {
        var t = $('[data-confirm-txn]', node);
        t.textContent = 'Keep your order number. If you do not hear from us within a day, message us on WhatsApp.';
        t.hidden = false;
      }
      if (kind === 'whatsapp') {
        var waBtn = $('[data-confirm-wa]', node);
        waBtn.href = waLink(waMessage(o));
        waBtn.hidden = false;
        $('[data-confirm-shop]', node).classList.add('btn--outline');
      }
      if (opts && opts.preview) $('[data-confirm-preview]', node).hidden = false;
      var swap = function () {
        if (cardCheckout) { try { cardCheckout.destroy(); } catch (e) { /* already gone */ } cardCheckout = null; }
        co.innerHTML = '';
        co.appendChild(node);
        Cart.clear();
        collectThemed();
        scrollToY(0, true);
        var c = $('.confirm', co);
        requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add('is-in'); }); });
        var h = $('h1', c); if (h) h.focus({ preventScroll: true });
        if (ST) ST.refresh();
        onScroll();
      };
      if (G) G.to(co, { opacity: 0, y: -16, duration: 0.35, ease: 'power2.in', onComplete: function () { swap(); G.set(co, { clearProps: 'all' }); } });
      else swap();
    }
    updateSubmit();
  }

  /* home: reviews and customer photos appear only once real content is added in content.js */
  function initContent() {
    var data = window.SITE_CONTENT || {};
    var rv = $('[data-reviews]', mainEl);
    if (rv && Array.isArray(data.reviews) && data.reviews.length) {
      $('.reviews__list', rv).innerHTML = data.reviews.map(function (r) {
        return '<figure class="review"><blockquote class="review__text">' + esc(r.text || '') + '</blockquote><figcaption class="small muted">' + esc(r.name || '') + (r.place ? ', ' + esc(r.place) : '') + '</figcaption></figure>';
      }).join('');
      rv.hidden = false;
    }
    var gl = $('[data-gallery]', mainEl);
    if (gl && Array.isArray(data.gallery) && data.gallery.length) {
      $('.gallery__grid', gl).innerHTML = data.gallery.map(function (g) {
        return '<img src="' + esc(g.src) + '" alt="' + esc(g.alt || 'Customer wearing +961') + '" loading="lazy" decoding="async">';
      }).join('');
      gl.hidden = false;
    }
  }

  function initAnchors(sig) {
    $$('a[href^="#"]', mainEl).forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = doc.getElementById(a.getAttribute('href').slice(1));
        if (t) { e.preventDefault(); scrollToEl(t); }
      }, sig);
    });
  }

  function initPage() {
    pageAC = typeof AbortController !== 'undefined' ? new AbortController() : { signal: undefined, abort: function () {} };
    var sig = { signal: pageAC.signal };
    collectThemed();
    initContent();
    initProduct(sig);
    initAccordions(sig);
    initSizeGuideLinks(sig);
    initCheckout(sig);
    initAnchors(sig);
    initMotion();
    setFabMessage(mainEl.getAttribute('data-route'));
    if (ST) ST.refresh();
    updateChrome();
    firstLoad = false;
  }
  function teardownPage() {
    if (pageAC) pageAC.abort();
    if (ST) ST.getAll().forEach(function (t) { t.kill(); });
    if (G) G.killTweensOf('main *');
  }

  /* ------------------------------------------------------------------ routing and page transitions */
  var templates = {};
  $$('template[data-route]').forEach(function (t) { templates[t.getAttribute('data-route')] = t; });
  var EMBEDDED = Object.keys(templates).length > 0;   // single-file preview build
  var current = mainEl.getAttribute('data-route') || 'index';
  var busy = false, ignoreHash = null;
  var curtain = $('.curtain'), curtainLogo = $('.curtain__logo');
  var metaDesc = $('meta[name="description"]');
  var announcer = $('#route-announcer');

  function parseHref(href) {
    var u;
    try { u = new URL(href, location.href); } catch (e) { return null; }
    if (u.origin !== location.origin) return null;
    var file = u.pathname.split('/').pop() || 'index.html';
    var m = /^([a-z0-9-]+)\.html$/.exec(file);
    if (!m || ROUTES.indexOf(m[1]) < 0) return null;
    return { route: m[1], hash: u.hash.slice(1), url: u.href };
  }

  function curtainIn() {
    return new Promise(function (res) {
      if (!G || !curtain) { res(); return; }
      G.set(curtain, { visibility: 'visible' });
      G.fromTo(curtain, { y: 0, yPercent: 100 }, { y: 0, yPercent: 0, duration: 0.55, ease: EASE_IO, onComplete: res });
      if (curtainLogo) G.fromTo(curtainLogo, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: EASE });
    });
  }
  function curtainOut() {
    return new Promise(function (res) {
      if (!G || !curtain) { root.classList.remove('is-entering'); res(); return; }
      G.set(curtain, { visibility: 'visible' });
      G.fromTo(curtain, { y: 0, yPercent: 0 }, {
        yPercent: -100, duration: 0.65, ease: EASE_IO, delay: 0.05,
        onComplete: function () { G.set(curtain, { y: 0, yPercent: 100, visibility: 'hidden' }); root.classList.remove('is-entering'); res(); }
      });
    });
  }

  function getPage(r) {
    if (EMBEDDED) {
      var t = templates[r.route] || templates['404'];
      return Promise.resolve({
        html: t.innerHTML, title: t.getAttribute('data-title'), description: t.getAttribute('data-description'),
        route: t.getAttribute('data-route'), template: t.getAttribute('data-template') || ''
      });
    }
    return fetch(r.url.split('#')[0], { credentials: 'same-origin', cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }).then(function (html) {
      var d = new DOMParser().parseFromString(html, 'text/html');
      var m = d.querySelector('main');
      if (!m) throw new Error('No main');
      var md = d.querySelector('meta[name="description"]');
      return { html: m.innerHTML, title: d.title, description: md ? md.content : '', route: m.getAttribute('data-route'), template: m.getAttribute('data-template') || '' };
    });
  }

  function swapMain(page, r) {
    teardownPage();
    mainEl.innerHTML = page.html;
    mainEl.setAttribute('data-route', page.route);
    mainEl.setAttribute('data-template', page.template);
    doc.title = page.title;
    if (metaDesc) metaDesc.setAttribute('content', page.description);
    current = page.route;
    setRouteAttrs();
    window.scrollTo(0, 0);
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    initPage();
    if (r && r.hash) {
      var t = doc.getElementById(r.hash);
      if (t) setTimeout(function () { scrollToEl(t, true); }, 30);
    }
    mainEl.focus({ preventScroll: true });
    if (announcer) announcer.textContent = page.title;
  }

  function setRouteAttrs() {
    root.setAttribute('data-page', current);
    root.setAttribute('data-template', mainEl.getAttribute('data-template') || '');
    $$('[data-nav]').forEach(function (a) {
      var on = a.getAttribute('data-nav') === current || (current === 'hoodie' || current === 't-shirt') && a.getAttribute('data-nav') === 'shop';
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function navigate(r, push) {
    if (busy) return;
    if (outdated && !EMBEDDED) { store.set('961-reloaded', newest, true); location.href = r.url; return; }
    busy = true;
    Promise.all([getPage(r), curtainIn()]).then(function (res) {
      swapMain(res[0], r);
      if (push && !EMBEDDED) { try { history.pushState({ route: r.route }, '', r.url); } catch (e) { /* ignore */ } }
      return curtainOut();
    }).then(function () { busy = false; }).catch(function () {
      busy = false;
      if (!EMBEDDED) { store.set('961-nav', '1', true); location.href = r.url; }
      else curtainOut();
    });
  }

  function go(r) {
    if (!r) return;
    closeAll();
    if (r.route === current) {
      var t = r.hash && doc.getElementById(r.hash);
      if (t) scrollToEl(t); else scrollToY(0);
      return;
    }
    if (EMBEDDED) {
      var key = r.route === 'index' ? 'home' : r.route;
      ignoreHash = key;
      try { location.hash = key; } catch (e) { /* ignore */ }
    }
    navigate(r, true);
  }

  doc.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|sms):/i.test(href)) return;
    var r = parseHref(a.href);
    if (!r) return;
    e.preventDefault();
    go(r);
  });

  if (EMBEDDED) {
    window.addEventListener('hashchange', function () {
      var key = location.hash.slice(1) || 'home';
      if (key === ignoreHash) { ignoreHash = null; return; }
      var route = key === 'home' ? 'index' : key;
      if (ROUTES.indexOf(route) < 0) return;
      if (route !== current) { closeAll(); navigate({ route: route, hash: '', url: route + '.html' }, false); }
    });
  } else {
    try { history.replaceState({ route: current }, ''); } catch (e) { /* ignore */ }
    window.addEventListener('popstate', function () {
      var r = parseHref(location.href);
      if (r && r.route !== current) { closeAll(); navigate(r, false); }
    });
  }
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      root.classList.remove('is-entering');
      if (curtain) { curtain.classList.remove('is-covering'); if (G) G.set(curtain, { y: 0, yPercent: 100, visibility: 'hidden' }); }
      busy = false;
    }
  });

  /* ------------------------------------------------------------------ always the newest version */
  // Browsers keep a saved copy of each page for a while. When a newer version of the site
  // has been published, the page reloads itself once (or, if the visitor is typing at
  // checkout, the next page change loads the new version instead).
  var BUILD = root.getAttribute('data-build');
  var outdated = false, newest = '', lastCheck = 0;
  function typing() {
    return $$('#main input, #main textarea, #main select').some(function (f) {
      return (f.type === 'radio' || f.type === 'checkbox') ? false : !!f.value && f.defaultValue !== f.value;
    });
  }
  function checkVersion() {
    if (EMBEDDED || !BUILD || !window.fetch || Date.now() - lastCheck < 30000) return;
    lastCheck = Date.now();
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (res) { return res.ok ? res.json() : null; }).then(function (j) {
      if (!j || !j.v || j.v === BUILD) return;
      outdated = true; newest = j.v;
      if (store.get('961-reloaded', true) === j.v || typing() || busy) return;
      store.set('961-reloaded', j.v, true);
      location.reload();
    }).catch(function () { /* offline: keep the page as it is */ });
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted) { lastCheck = 0; checkVersion(); } });
  doc.addEventListener('visibilitychange', function () { if (doc.visibilityState === 'visible') checkVersion(); });

  /* ------------------------------------------------------------------ boot */
  function boot() {
    renderCart();
    if (EMBEDDED && location.hash) {
      // The preview always opens on the home page, never on the last page visited.
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
    }
    setRouteAttrs();
    initPage();
    if (root.classList.contains('has-intro')) store.set('961-intro', '1');
    checkVersion();
    if (root.classList.contains('is-entering')) curtainOut();
    if (location.hash && !EMBEDDED) {
      var target = doc.getElementById(location.hash.slice(1));
      if (target) setTimeout(function () { scrollToEl(target, true); }, 60);
    }
  }
  var fontsReady = doc.fonts && doc.fonts.ready ? Promise.race([doc.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })]) : Promise.resolve();
  fontsReady.then(boot, boot);
})();
