// node_modules/lit-html/lit-html.js
var t = globalThis;
var i = (t2) => t2;
var s = t.trustedTypes;
var e = s ? s.createPolicy("lit-html", { createHTML: (t2) => t2 }) : void 0;
var h = "$lit$";
var o = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n = "?" + o;
var r = `<${n}>`;
var l = document;
var c = () => l.createComment("");
var a = (t2) => null === t2 || "object" != typeof t2 && "function" != typeof t2;
var u = Array.isArray;
var d = (t2) => u(t2) || "function" == typeof t2?.[Symbol.iterator];
var f = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p = RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y = /^(?:script|style|textarea|title)$/i;
var x = (t2) => (i2, ...s2) => ({ _$litType$: t2, strings: i2, values: s2 });
var b = x(1);
var w = x(2);
var T = x(3);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l.createTreeWalker(l, 129);
function V(t2, i2) {
  if (!u(t2) || !t2.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e ? e.createHTML(i2) : i2;
}
var N = (t2, i2) => {
  const s2 = t2.length - 1, e2 = [];
  let n2, l2 = 2 === i2 ? "<svg>" : 3 === i2 ? "<math>" : "", c2 = v;
  for (let i3 = 0; i3 < s2; i3++) {
    const s3 = t2[i3];
    let a2, u2, d2 = -1, f2 = 0;
    for (; f2 < s3.length && (c2.lastIndex = f2, u2 = c2.exec(s3), null !== u2); ) f2 = c2.lastIndex, c2 === v ? "!--" === u2[1] ? c2 = _ : void 0 !== u2[1] ? c2 = m : void 0 !== u2[2] ? (y.test(u2[2]) && (n2 = RegExp("</" + u2[2], "g")), c2 = p) : void 0 !== u2[3] && (c2 = p) : c2 === p ? ">" === u2[0] ? (c2 = n2 ?? v, d2 = -1) : void 0 === u2[1] ? d2 = -2 : (d2 = c2.lastIndex - u2[2].length, a2 = u2[1], c2 = void 0 === u2[3] ? p : '"' === u2[3] ? $ : g) : c2 === $ || c2 === g ? c2 = p : c2 === _ || c2 === m ? c2 = v : (c2 = p, n2 = void 0);
    const x2 = c2 === p && t2[i3 + 1].startsWith("/>") ? " " : "";
    l2 += c2 === v ? s3 + r : d2 >= 0 ? (e2.push(a2), s3.slice(0, d2) + h + s3.slice(d2) + o + x2) : s3 + o + (-2 === d2 ? i3 : x2);
  }
  return [V(t2, l2 + (t2[s2] || "<?>") + (2 === i2 ? "</svg>" : 3 === i2 ? "</math>" : "")), e2];
};
var S = class _S {
  constructor({ strings: t2, _$litType$: i2 }, e2) {
    let r2;
    this.parts = [];
    let l2 = 0, a2 = 0;
    const u2 = t2.length - 1, d2 = this.parts, [f2, v2] = N(t2, i2);
    if (this.el = _S.createElement(f2, e2), P.currentNode = this.el.content, 2 === i2 || 3 === i2) {
      const t3 = this.el.content.firstChild;
      t3.replaceWith(...t3.childNodes);
    }
    for (; null !== (r2 = P.nextNode()) && d2.length < u2; ) {
      if (1 === r2.nodeType) {
        if (r2.hasAttributes()) for (const t3 of r2.getAttributeNames()) if (t3.endsWith(h)) {
          const i3 = v2[a2++], s2 = r2.getAttribute(t3).split(o), e3 = /([.?@])?(.*)/.exec(i3);
          d2.push({ type: 1, index: l2, name: e3[2], strings: s2, ctor: "." === e3[1] ? I : "?" === e3[1] ? L : "@" === e3[1] ? z : H }), r2.removeAttribute(t3);
        } else t3.startsWith(o) && (d2.push({ type: 6, index: l2 }), r2.removeAttribute(t3));
        if (y.test(r2.tagName)) {
          const t3 = r2.textContent.split(o), i3 = t3.length - 1;
          if (i3 > 0) {
            r2.textContent = s ? s.emptyScript : "";
            for (let s2 = 0; s2 < i3; s2++) r2.append(t3[s2], c()), P.nextNode(), d2.push({ type: 2, index: ++l2 });
            r2.append(t3[i3], c());
          }
        }
      } else if (8 === r2.nodeType) if (r2.data === n) d2.push({ type: 2, index: l2 });
      else {
        let t3 = -1;
        for (; -1 !== (t3 = r2.data.indexOf(o, t3 + 1)); ) d2.push({ type: 7, index: l2 }), t3 += o.length - 1;
      }
      l2++;
    }
  }
  static createElement(t2, i2) {
    const s2 = l.createElement("template");
    return s2.innerHTML = t2, s2;
  }
};
function M(t2, i2, s2 = t2, e2) {
  if (i2 === E) return i2;
  let h2 = void 0 !== e2 ? s2._$Co?.[e2] : s2._$Cl;
  const o2 = a(i2) ? void 0 : i2._$litDirective$;
  return h2?.constructor !== o2 && (h2?._$AO?.(false), void 0 === o2 ? h2 = void 0 : (h2 = new o2(t2), h2._$AT(t2, s2, e2)), void 0 !== e2 ? (s2._$Co ??= [])[e2] = h2 : s2._$Cl = h2), void 0 !== h2 && (i2 = M(t2, h2._$AS(t2, i2.values), h2, e2)), i2;
}
var R = class {
  constructor(t2, i2) {
    this._$AV = [], this._$AN = void 0, this._$AD = t2, this._$AM = i2;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t2) {
    const { el: { content: i2 }, parts: s2 } = this._$AD, e2 = (t2?.creationScope ?? l).importNode(i2, true);
    P.currentNode = e2;
    let h2 = P.nextNode(), o2 = 0, n2 = 0, r2 = s2[0];
    for (; void 0 !== r2; ) {
      if (o2 === r2.index) {
        let i3;
        2 === r2.type ? i3 = new k(h2, h2.nextSibling, this, t2) : 1 === r2.type ? i3 = new r2.ctor(h2, r2.name, r2.strings, this, t2) : 6 === r2.type && (i3 = new Z(h2, this, t2)), this._$AV.push(i3), r2 = s2[++n2];
      }
      o2 !== r2?.index && (h2 = P.nextNode(), o2++);
    }
    return P.currentNode = l, e2;
  }
  p(t2) {
    let i2 = 0;
    for (const s2 of this._$AV) void 0 !== s2 && (void 0 !== s2.strings ? (s2._$AI(t2, s2, i2), i2 += s2.strings.length - 2) : s2._$AI(t2[i2])), i2++;
  }
};
var k = class _k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t2, i2, s2, e2) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t2, this._$AB = i2, this._$AM = s2, this.options = e2, this._$Cv = e2?.isConnected ?? true;
  }
  get parentNode() {
    let t2 = this._$AA.parentNode;
    const i2 = this._$AM;
    return void 0 !== i2 && 11 === t2?.nodeType && (t2 = i2.parentNode), t2;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t2, i2 = this) {
    t2 = M(this, t2, i2), a(t2) ? t2 === A || null == t2 || "" === t2 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t2 !== this._$AH && t2 !== E && this._(t2) : void 0 !== t2._$litType$ ? this.$(t2) : void 0 !== t2.nodeType ? this.T(t2) : d(t2) ? this.k(t2) : this._(t2);
  }
  O(t2) {
    return this._$AA.parentNode.insertBefore(t2, this._$AB);
  }
  T(t2) {
    this._$AH !== t2 && (this._$AR(), this._$AH = this.O(t2));
  }
  _(t2) {
    this._$AH !== A && a(this._$AH) ? this._$AA.nextSibling.data = t2 : this.T(l.createTextNode(t2)), this._$AH = t2;
  }
  $(t2) {
    const { values: i2, _$litType$: s2 } = t2, e2 = "number" == typeof s2 ? this._$AC(t2) : (void 0 === s2.el && (s2.el = S.createElement(V(s2.h, s2.h[0]), this.options)), s2);
    if (this._$AH?._$AD === e2) this._$AH.p(i2);
    else {
      const t3 = new R(e2, this), s3 = t3.u(this.options);
      t3.p(i2), this.T(s3), this._$AH = t3;
    }
  }
  _$AC(t2) {
    let i2 = C.get(t2.strings);
    return void 0 === i2 && C.set(t2.strings, i2 = new S(t2)), i2;
  }
  k(t2) {
    u(this._$AH) || (this._$AH = [], this._$AR());
    const i2 = this._$AH;
    let s2, e2 = 0;
    for (const h2 of t2) e2 === i2.length ? i2.push(s2 = new _k(this.O(c()), this.O(c()), this, this.options)) : s2 = i2[e2], s2._$AI(h2), e2++;
    e2 < i2.length && (this._$AR(s2 && s2._$AB.nextSibling, e2), i2.length = e2);
  }
  _$AR(t2 = this._$AA.nextSibling, s2) {
    for (this._$AP?.(false, true, s2); t2 !== this._$AB; ) {
      const s3 = i(t2).nextSibling;
      i(t2).remove(), t2 = s3;
    }
  }
  setConnected(t2) {
    void 0 === this._$AM && (this._$Cv = t2, this._$AP?.(t2));
  }
};
var H = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t2, i2, s2, e2, h2) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t2, this.name = i2, this._$AM = e2, this.options = h2, s2.length > 2 || "" !== s2[0] || "" !== s2[1] ? (this._$AH = Array(s2.length - 1).fill(new String()), this.strings = s2) : this._$AH = A;
  }
  _$AI(t2, i2 = this, s2, e2) {
    const h2 = this.strings;
    let o2 = false;
    if (void 0 === h2) t2 = M(this, t2, i2, 0), o2 = !a(t2) || t2 !== this._$AH && t2 !== E, o2 && (this._$AH = t2);
    else {
      const e3 = t2;
      let n2, r2;
      for (t2 = h2[0], n2 = 0; n2 < h2.length - 1; n2++) r2 = M(this, e3[s2 + n2], i2, n2), r2 === E && (r2 = this._$AH[n2]), o2 ||= !a(r2) || r2 !== this._$AH[n2], r2 === A ? t2 = A : t2 !== A && (t2 += (r2 ?? "") + h2[n2 + 1]), this._$AH[n2] = r2;
    }
    o2 && !e2 && this.j(t2);
  }
  j(t2) {
    t2 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t2 ?? "");
  }
};
var I = class extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t2) {
    this.element[this.name] = t2 === A ? void 0 : t2;
  }
};
var L = class extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t2) {
    this.element.toggleAttribute(this.name, !!t2 && t2 !== A);
  }
};
var z = class extends H {
  constructor(t2, i2, s2, e2, h2) {
    super(t2, i2, s2, e2, h2), this.type = 5;
  }
  _$AI(t2, i2 = this) {
    if ((t2 = M(this, t2, i2, 0) ?? A) === E) return;
    const s2 = this._$AH, e2 = t2 === A && s2 !== A || t2.capture !== s2.capture || t2.once !== s2.once || t2.passive !== s2.passive, h2 = t2 !== A && (s2 === A || e2);
    e2 && this.element.removeEventListener(this.name, this, s2), h2 && this.element.addEventListener(this.name, this, t2), this._$AH = t2;
  }
  handleEvent(t2) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t2) : this._$AH.handleEvent(t2);
  }
};
var Z = class {
  constructor(t2, i2, s2) {
    this.element = t2, this.type = 6, this._$AN = void 0, this._$AM = i2, this.options = s2;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t2) {
    M(this, t2);
  }
};
var B = t.litHtmlPolyfillSupport;
B?.(S, k), (t.litHtmlVersions ??= []).push("3.3.2");
var D = (t2, i2, s2) => {
  const e2 = s2?.renderBefore ?? i2;
  let h2 = e2._$litPart$;
  if (void 0 === h2) {
    const t3 = s2?.renderBefore ?? null;
    e2._$litPart$ = h2 = new k(i2.insertBefore(c(), t3), t3, void 0, s2 ?? {});
  }
  return h2._$AI(t2), h2;
};

// src/components/button.ts
var McButton = class extends HTMLElement {
  static observedAttributes = ["variant", "disabled", "label"];
  get variant() {
    const v2 = this.getAttribute("variant");
    return v2 === "ghost" || v2 === "danger" ? v2 : "primary";
  }
  get disabled() {
    return this.hasAttribute("disabled");
  }
  attributeChangedCallback() {
    this.render();
  }
  connectedCallback() {
    this.render();
    this.addEventListener("click", (e2) => {
      if (this.disabled) e2.stopPropagation();
    });
  }
  render() {
    const label = this.getAttribute("label") ?? this.textContent?.trim() ?? "";
    const cls = this.variant === "ghost" ? "mc-btn mc-btn--ghost" : this.variant === "danger" ? "mc-btn mc-btn--danger" : "mc-btn mc-btn--primary";
    D(
      b`
        <button class="${cls}" ?disabled=${this.disabled} part="control">
          ${label}
        </button>
      `,
      this
    );
  }
};
if (!customElements.get("mc-button")) {
  customElements.define("mc-button", McButton);
}

// src/components/top-bar.ts
var McTopBar = class extends HTMLElement {
  static observedAttributes = ["title", "show-back", "show-settings"];
  connectedCallback() {
    this.render();
    this.addEventListener("click", (e2) => {
      const t2 = e2.target;
      if (t2.closest('[data-action="back"]')) {
        this.dispatchEvent(new CustomEvent("mc-back", { bubbles: true, composed: true }));
      }
      if (t2.closest('[data-action="settings"]')) {
        this.dispatchEvent(new CustomEvent("mc-settings", { bubbles: true, composed: true }));
      }
    });
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const title = this.getAttribute("title") ?? "";
    const showBack = this.hasAttribute("show-back");
    const showSettings = this.hasAttribute("show-settings");
    D(
      b`
        <header class="mc-topbar">
          <div class="mc-topbar__left">
            ${showBack ? b`<button type="button" class="mc-topbar__icon" data-action="back" aria-label="Back">←</button>` : b`<span class="mc-topbar__mark">MC</span>`}
          </div>
          <div class="mc-topbar__title">${title}</div>
          <div class="mc-topbar__right">
            ${showSettings ? b`<button type="button" class="mc-topbar__icon" data-action="settings" aria-label="Settings">⚙</button>` : ""}
          </div>
        </header>
      `,
      this
    );
  }
};
if (!customElements.get("mc-top-bar")) {
  customElements.define("mc-top-bar", McTopBar);
}

// src/components/progress-bar.ts
var McProgressBar = class extends HTMLElement {
  static observedAttributes = ["value"];
  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const raw = Number(this.getAttribute("value") ?? "0");
    const value = Math.max(0, Math.min(1, Number.isFinite(raw) ? raw : 0));
    D(
      b`
        <div class="mc-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(value * 100)}">
          <div class="mc-progress__fill" style="width:${value * 100}%"></div>
        </div>
      `,
      this
    );
  }
};
if (!customElements.get("mc-progress-bar")) {
  customElements.define("mc-progress-bar", McProgressBar);
}

// src/components/poster-card.ts
var McPosterCard = class extends HTMLElement {
  static observedAttributes = ["title", "image", "selected", "square"];
  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const title = this.getAttribute("title") ?? "";
    const image = this.getAttribute("image") ?? "";
    const selected = this.hasAttribute("selected");
    const square = this.hasAttribute("square");
    const ratioClass = square ? "mc-poster mc-poster--square" : "mc-poster";
    D(
      b`
        <button type="button" class="${ratioClass} ${selected ? "mc-poster--selected" : ""}" aria-pressed="${selected}">
          <img src="${image}" alt="" loading="lazy" />
          <span class="mc-poster__cap">${title}</span>
        </button>
      `,
      this
    );
  }
};
if (!customElements.get("mc-poster-card")) {
  customElements.define("mc-poster-card", McPosterCard);
}

// src/components/streamer-tile.ts
var McStreamerTile = class extends HTMLElement {
  static observedAttributes = ["name", "logo", "selected"];
  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const name = this.getAttribute("name") ?? "";
    const logo = this.getAttribute("logo") ?? "";
    const selected = this.hasAttribute("selected");
    D(
      b`
        <button type="button" class="mc-streamer ${selected ? "mc-streamer--selected" : ""}" aria-pressed="${selected}">
          <div class="mc-streamer__logo">${logo ? b`<img src="${logo}" alt="" />` : b`<span class="mc-streamer__mono">${name.slice(0, 1)}</span>`}</div>
          <div class="mc-streamer__name">${name}</div>
        </button>
      `,
      this
    );
  }
};
if (!customElements.get("mc-streamer-tile")) {
  customElements.define("mc-streamer-tile", McStreamerTile);
}

// src/components/modal.ts
var McModal = class extends HTMLElement {
  static observedAttributes = ["open", "title"];
  connectedCallback() {
    this.render();
    this.addEventListener("click", (e2) => {
      const t2 = e2.target;
      if (t2.closest("[data-close]")) {
        this.removeAttribute("open");
        this.dispatchEvent(new CustomEvent("mc-close", { bubbles: true, composed: true }));
      }
    });
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const open = this.hasAttribute("open");
    const title = this.getAttribute("title") ?? "";
    D(
      b`
        <div class="mc-modal ${open ? "mc-modal--open" : ""}" aria-hidden="${!open}">
          <div class="mc-modal__backdrop" data-close></div>
          <div class="mc-modal__panel" role="dialog" aria-modal="true" aria-label="${title}">
            <div class="mc-modal__head">
              <div class="mc-modal__title">${title}</div>
              <button type="button" class="mc-modal__x" data-close aria-label="Close">×</button>
            </div>
            <div class="mc-modal__body"><slot></slot></div>
          </div>
        </div>
      `,
      this
    );
  }
};
if (!customElements.get("mc-modal")) {
  customElements.define("mc-modal", McModal);
}

// src/test-components.ts
var demo = () => b`
  <div class="screen">
    <h2>Design system</h2>
    <p class="muted">Tokens + web components</p>
    <section style="margin:16px 0;display:grid;gap:12px;">
      <mc-top-bar title="Preview" show-back show-settings></mc-top-bar>
      <mc-button label="Primary"></mc-button>
      <mc-button variant="ghost" label="Ghost"></mc-button>
      <mc-progress-bar value="0.42"></mc-progress-bar>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        <mc-poster-card
          title="Sample Show"
          image="https://placehold.co/400x600/141414/E50914/png?text=2%3A3"
        ></mc-poster-card>
        <mc-streamer-tile name="Netflix" selected></mc-streamer-tile>
        <mc-streamer-tile name="Showmax"></mc-streamer-tile>
      </div>
      <mc-modal id="demo-modal" title="Example" open>
        <p class="muted">Modal body via slot.</p>
      </mc-modal>
    </section>
  </div>
`;
D(demo(), document.getElementById("demo"));
/*! Bundled license information:

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=test-components.js.map
