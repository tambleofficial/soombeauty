/* 숨뷰티 관리자 연결 (공개 화면용)
 *  - text.t 의 '#칸이름' 키는 data-sj-id 가 붙은 칸(후기 등)만 바꿈
 * 서버(functions/_middleware.js)가 넣어준 window.__CMS 를 화면에 반영합니다.
 *  - text.t   : { 원래 문구: 바꾼 문구 }  → 화면에 그려지는 문구를 바꿔 보여줌
 *  - media.m  : { '/assets/원래파일': '/assets/uploads/새파일' } → 일반 사진 교체
 *               { 'slot:칸이름': '/assets/uploads/새파일' } → 사진 칸 교체 (assets/slot-state.js 가 반영)
 */
(function () {
  var C = window.__CMS || {};
  var media = (C.media && C.media.m) || {};
  var mkeys = Object.keys(media);
  function pathOf(u) { try { return new URL(u, location.href).pathname; } catch (e) { return u; } }
  function swapMedia(root) {
    if (!mkeys.length || !root || !root.querySelectorAll) return;
    var list = root.matches && root.matches('img[src]') ? [root] : [];
    list = list.concat([].slice.call(root.querySelectorAll('img[src]')));
    for (var i = 0; i < list.length; i++) { var el = list[i], p = pathOf(el.getAttribute('src')); if (Object.prototype.hasOwnProperty.call(media, p) && el.getAttribute('src') !== media[p]) { el.setAttribute('data-sj-key', p); el.setAttribute('src', media[p]); } }
  }
  window.__sjSwapMedia = swapMedia;

  /* 빈 사진 칸(data-slot-id): 틀 크기·모양은 그대로, 사진은 자르지 않고 전체 표시(남는 곳은 같은 사진을 흐리게), 비율이 거의 같으면 꽉 채움 */
  var css = document.createElement('style');
  css.textContent = '.sj-fill{position:absolute;inset:0;z-index:1;overflow:hidden;border-radius:inherit;pointer-events:none}.sj-fill img{position:absolute;inset:0;width:100%;height:100%;display:block}.sj-fill .sj-b{object-fit:cover;filter:blur(18px);transform:scale(1.15)}.sj-fill .sj-f{object-fit:contain}.sj-fill.sj-cover .sj-b{display:none}.sj-fill.sj-cover .sj-f{object-fit:cover}[data-sj-filled]{color:transparent!important}[data-sj-filled]>:not(.sj-fill):not([data-keep]){visibility:hidden}';
  (document.head || document.documentElement).appendChild(css);
  function fillSlot(el, src) {
    if (!el || !src) return;
    var box = el.querySelector(':scope > .sj-fill');
    if (box && box.getAttribute('data-src') === src) return;
    if (!box) { box = document.createElement('div'); box.className = 'sj-fill'; box.innerHTML = '<img class="sj-b" alt=""><img class="sj-f" alt="">'; el.appendChild(box); }
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    box.setAttribute('data-src', src); el.setAttribute('data-sj-filled', '');
    var f = box.querySelector('.sj-f'), b = box.querySelector('.sj-b');
    f.alt = altOf(el.getAttribute('data-slot-id') || '');
    f.onload = function () { var r = el.getBoundingClientRect(); if (!r.width || !r.height) return; var ir = f.naturalWidth / f.naturalHeight, br = r.width / r.height; box.classList.toggle('sj-cover', 1 - Math.min(ir / br, br / ir) < 0.04); };
    b.src = src; f.src = src;
  }
  window.__sjFillSlot = fillSlot;
  // 올린 사진의 대체 문구 (검색·접근성)
  function altOf(id) {
    var A = [[/^home-hero/, '숨뷰티 대표 사진'], [/^home-brand/, '숨뷰티 분위기 사진'], [/director/, '숨뷰티 대표원장'], [/^home-prog-01/, '숨뷰티 눈썹문신 시술 사진'], [/^home-prog-02/, '숨뷰티 입술 반영구 시술 사진'], [/^prog-hair/, '숨뷰티 헤어스트록 눈썹 시술 사진'], [/^prog-feather/, '숨뷰티 패더링 눈썹 시술 사진'], [/^prog-lip/, '숨뷰티 퍼스널 입술 시술 사진'], [/case/, '숨뷰티 시술 사례 사진'], [/step/, '숨뷰티 시술 과정 사진'], [/review/, '숨뷰티 고객 후기 사진'], [/studio/, '숨뷰티 공간 사진'], [/film/, '숨뷰티 시술 영상 미리보기']];
    for (var i = 0; i < A.length; i++) if (A[i][0].test(id)) return A[i][1];
    return '숨뷰티 사진';
  }
  function slotSrc(id) { return media['slot:' + id]; }
  function fillAll(root) {
    var list = (root && root.querySelectorAll) ? [].slice.call(root.querySelectorAll('[data-slot-id]')) : [];
    if (root && root.matches && root.matches('[data-slot-id]')) list.unshift(root);
    for (var i = 0; i < list.length; i++) { var id = list[i].getAttribute('data-slot-id'), s = slotSrc(id); if (s && !/^__UP/.test(s)) fillSlot(list[i], s); }
  }
  window.__sjFillAll = fillAll;
  if (mkeys.some(function (k) { return k.indexOf('slot:') === 0; })) {
    var fq = 0; new MutationObserver(function () { if (fq) return; fq = requestAnimationFrame(function () { fq = 0; fillAll(document.body); }); })
      .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-slot-id'] });
    document.addEventListener('DOMContentLoaded', function () { fillAll(document.body); });
  }
  if (mkeys.length) {
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var m = ms[i]; if (m.type === 'attributes') swapMedia(m.target); else for (var j = 0; j < m.addedNodes.length; j++) if (m.addedNodes[j].nodeType === 1) swapMedia(m.addedNodes[j]); } })
      .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
    document.addEventListener('DOMContentLoaded', function () { swapMedia(document.body); });
  }

  var T = (C.text && C.text.t) || {};
  var keys = Object.keys(T);
  window.__sjNorm = function (s) { return String(s || '').replace(/\u00a0/g, ' ').replace(/[ \t\r\f\v]+/g, ' ').replace(/ *\n */g, '\n').trim(); };
  if (!keys.length) return;
  var norm = window.__sjNorm;
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var SKIP = { SCRIPT: 1, STYLE: 1, TEMPLATE: 1, TEXTAREA: 1, INPUT: 1, SVG: 1, HELMET: 1 };
  // 글자만(줄바꿈 포함) 들어 있는 요소인지
  function leafText(el) {
    if (!el || SKIP[el.tagName] || el.isContentEditable) return null;
    var txt = '', has = false;
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) { txt += n.nodeValue; if (/\S/.test(n.nodeValue)) has = true; }
      else if (n.nodeType === 1 && n.tagName === 'BR') txt += '\n';
      else return null;
    }
    return has ? norm(txt) : null;
  }
  function applyEl(el) {
    var id = el.getAttribute && el.getAttribute('data-sj-id');
    if (id) {
      if (!Object.prototype.hasOwnProperty.call(T, '#' + id)) return;
      var t0 = leafText(el); if (t0 === null) return;
      var v0 = T['#' + id]; if (norm(v0) === t0) return;
      if (!el.hasAttribute('data-sj-orig')) el.setAttribute('data-sj-orig', t0);
      el.innerHTML = esc(v0).replace(/\n/g, '<br>'); return;
    }
    var t = leafText(el);
    if (t === null || !Object.prototype.hasOwnProperty.call(T, t)) return;
    var v = T[t];
    if (norm(v) === t) return;
    el.setAttribute('data-sj-orig', t);
    el.innerHTML = esc(v).replace(/\n/g, '<br>');
  }
  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    applyEl(root);
    var all = root.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) applyEl(all[i]);
  }
  window.__sjApplyText = scan;
  var pending = [], sched = false;
  function flush() { sched = false; var list = pending; pending = []; for (var i = 0; i < list.length; i++) scan(list[i]); }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (m.type === 'characterData') { if (m.target.parentNode) pending.push(m.target.parentNode); }
      else { for (var j = 0; j < m.addedNodes.length; j++) { var a = m.addedNodes[j]; pending.push(a.nodeType === 1 ? a : a.parentNode); } }
    }
    if (!sched && pending.length) { sched = true; Promise.resolve().then(flush); }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  document.addEventListener('DOMContentLoaded', function () { scan(document.body); });
})();
