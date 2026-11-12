"use strict";
/* Stockclair · pages de texte (mentions légales, confidentialité). Reprend les contacts de config.js : une adresse réglée là apparaît ici sans rien modifier d'autre. */
(function () {
  var C = window.STOCKCLAIR || {};
  var propre = function (v) { return String(v == null ? "" : v).trim(); };
  var email = /^\S+@\S+\.\S+$/.test(propre(C.email)) ? propre(C.email) : "", telephone = propre(C.telephone);
  /* <span data-config="email"> ou "telephone" : le texte « à compléter » est remplacé par la valeur réglée */
  [].forEach.call(document.querySelectorAll("[data-config]"), function (e) {
    var cle = e.getAttribute("data-config"), v = cle === "email" ? email : cle === "telephone" ? telephone : "";
    if (!v) return;
    var a = document.createElement("a");
    a.href = cle === "email" ? "mailto:" + v : "tel:" + v.replace(/[^\d+]/g, "");
    a.textContent = v;
    e.parentNode.replaceChild(a, e);
  });
  /* Le lien « Contact » ne s'affiche que si la page d'accueil a une rubrique Contact */
  if (!email && !telephone && !propre(C.whatsapp) && !/^https:\/\//.test(propre(C.formulaire))) {
    [].forEach.call(document.querySelectorAll('a[href$="#contact"]'), function (a) { a.parentNode.removeChild(a); });
  }
})();
