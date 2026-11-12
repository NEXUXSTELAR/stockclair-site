"use strict";
/* Stockclair · site public. Aucune donnée n'est envoyée sans une action du visiteur ; aucun traceur. */
(function () {
  const C = window.STOCKCLAIR || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  /* Typographie française, appliquée à tout texte écrit dans la page : espace insécable avant « : ; ? ! » et dans les guillemets, apostrophe courbe */
  const typo = t => String(t).replace(/ ([:;?!»])/g, " $1").replace(/« /g, "« ").replace(/([A-Za-zÀ-ÿ])'(?=[A-Za-zÀ-ÿ«])/g, "$1’");
  const html = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const esc = t => html(typo(t));
  const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const memoire = { lire: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, ecrire: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* navigation privée */ } } };
  document.documentElement.classList.add("js");
  /* Ce qu'il faut charger avant d'imprimer : les captures qui attendent que leur section approche */
  const avantImpression = [];

  /* Les métiers : ce que montre chaque démo. qr = position de l'étiquette sur la photo (x, y, taille en % de la largeur) ; une quatrième valeur, facultative, dit quel point de la largeur reste au centre du cadrage (50 par défaut). */
  const METIERS = {
    artisan:      { nom: "Artisans, maintenance, BTP", court: "Artisan", qr: [51.3, 43.6, 5.5],
                    geste: "Le perforateur est sur quel chantier ? Chaque sortie porte un nom et un chantier.",
                    legende: "On scanne l'outil : il part sur un chantier, avec un nom." },
    menuisier:    { nom: "Menuisiers-poseurs, agenceurs", court: "Menuisier", qr: [52, 34.5, 5],
                    geste: "La scie plongeante et le laser rentrent au dépôt ; la mousse, le silicone et les cales sont comptés par chantier.",
                    legende: "L'étiquette est dans la mallette : on sait sur quel chantier est la machine." },
    loueur:      { nom: "Location de matériel, événementiel", court: "Location", qr: [51.2, 45.8, 8],
                    geste: "« Avez-vous 300 chaises le 14 ? » La réponse en dix secondes, et le relevé de casse prêt au retour.",
                    legende: "Une étiquette sur le chariot : un scan pour tout le lot de chaises." },
    restaurant:   { nom: "Restaurants, traiteurs", court: "Restaurant", qr: [50.5, 38, 6.5],
                    geste: "Ce qu'il faut utiliser en premier, et ce qui sort à chaque service.",
                    legende: "Une étiquette par étagère : on tape ce qu'on prend." },
    labo:         { nom: "Laboratoires, santé, écoles", court: "Laboratoire", qr: [48, 61, 7.5],
                    geste: "Qui a le microscope ? Les appareils prêtés, et les dates limites des produits.",
                    legende: "L'appareil est emprunté, puis rendu : on sait par qui." },
    ambulance:    { nom: "Ambulances, transport sanitaire", court: "Ambulance", qr: [49.7, 39.4, 9],
                    geste: "La dotation de chaque véhicule, ce qui y manque, et ce qui approche de sa date limite.",
                    legende: "Une étiquette dans le véhicule : on voit ce qui manque à sa dotation." },
    paysagiste:   { nom: "Paysagistes, espaces verts", court: "Paysagiste", qr: [49.5, 46.7, 8],
                    geste: "Les machines rentrent le soir, et les fournitures sont comptées par chantier.",
                    legende: "Le soir, on voit quelles machines ne sont pas rentrées." },
    proprete:     { nom: "Propreté, nettoyage", court: "Propreté", qr: [46.1, 52.8, 9.5],
                    geste: "Les produits de chaque site, les machines laissées sur place, et leurs entretiens à faire.",
                    legende: "La machine porte son étiquette : on sait sur quel site elle est." },
    industrie:    { nom: "Ateliers, industrie", court: "Atelier", qr: [53.1, 55.5, 9, 58],
                    geste: "Les outils coupants sont comptés par affaire, et les instruments de mesure prêtés reviennent.",
                    legende: "Une étiquette sur le bac : on tape ce qu'on prend pour l'affaire." },
    brasserie:    { nom: "Brasseries, boissons", court: "Brasserie", qr: [49.2, 59.7, 9],
                    geste: "Les fûts partent chez les bars et reviennent vides : vous savez lesquels sont dehors.",
                    legende: "Chaque fût porte sa plaquette : on sait chez quel bar il est." },
    distribution: { nom: "Quincaillerie, négoce", court: "Quincaillerie", qr: [56.7, 46.7, 6, 60],
                    geste: "Les commandes se préparent avant la rupture, et vous voyez ce qui dort sur les étagères.",
                    legende: "Une étiquette sur le bord de l'étagère : on compte le lot." },
    ong:          { nom: "ONG, associations", court: "ONG", qr: [48.1, 47.8, 12],
                    geste: "Chaque kit distribué est compté, par lieu de distribution.",
                    legende: "Ce qui est distribué est compté, lieu par lieu." }
  };
  /* Un lien du type ?metier=paysagiste ouvre le site sur ce métier : il passe en premier partout */
  const demande = new URLSearchParams(location.search).get("metier");
  const prefere = METIERS[demande] ? demande : null;
  const ORDRE = Object.keys(METIERS).sort((a, b) => (b === prefere) - (a === prefere));
  const lienDemo = m => (C.demo || "#") + "?metier=" + m;
  /* La démo d'un patron qui a plusieurs établissements : trois restaurants, ouverte sur l'écran « Groupe » */
  const lienGroupe = (C.demo || "#") + "?groupe=restaurants&profil=direction";
  $$("a[data-groupe]").forEach(a => { a.href = lienGroupe; });

  /* En-tête : filet au défilement, bouton flottant, menu du téléphone, rubrique en cours */
  const tete = $("#tete"), flottant = $("#flottant"), menu = $("#menu"), boutonMenu = $("#boutonMenu");
  const auDefilement = () => {
    tete.classList.toggle("defile", scrollY > 8);
    const zone = ["#demo", "#contact", "#essai", "#geste"].some(s => { const r = $(s).getBoundingClientRect(); return r.top < innerHeight * .8 && r.bottom > 0; });
    flottant.classList.toggle("la", scrollY > innerHeight * .9 && !zone);
  };
  addEventListener("scroll", auDefilement, { passive: true }); auDefilement();
  const fermerMenu = () => { menu.classList.remove("ouvert"); boutonMenu.setAttribute("aria-expanded", "false"); };
  boutonMenu.addEventListener("click", () => { const o = menu.classList.toggle("ouvert"); boutonMenu.setAttribute("aria-expanded", o); });
  menu.addEventListener("click", e => { if (e.target.closest("a")) fermerMenu(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") fermerMenu(); });
  if ("IntersectionObserver" in window) {
    const liens = $$("a", menu), vus = new Set();
    const obs = new IntersectionObserver(es => {
      es.forEach(e => e.isIntersecting ? vus.add(e.target.id) : vus.delete(e.target.id));
      const ici = liens.map(a => a.hash.slice(1)).find(id => vus.has(id));
      liens.forEach(a => a.classList.toggle("ici", a.hash.slice(1) === ici));
    }, { rootMargin: "-45% 0px -50% 0px" });
    liens.forEach(a => { const s = $(a.hash); if (s) obs.observe(s); });
  }

  /* Scène d'accueil : le viseur se pose sur l'étiquette, la fiche s'ouvre */
  const scene = $("#scene"), photo = $("#scenePhoto"), viseur = $("#viseur"), tel = $("#sceneTel"), ecran = $("#sceneEcran"), legende = $("#sceneLegende"), choix = $("#sceneChoix");
  viseur.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="cadre" d="M60 7H31A24 24 0 0 0 7 31V69A24 24 0 0 0 31 93H69A24 24 0 0 0 93 69V40"/><path class="cadre" d="M76 9A24 24 0 0 1 91 24"/><rect class="coeur" x="33" y="33" width="34" height="34" rx="8"/></svg>';
  const calques = [document.createElement("img"), document.createElement("img")];
  /* La photo est recadrée par la scène : sa largeur affichée dépasse celle de l'écran sur téléphone. Mêmes valeurs que le préchargement de index.html. */
  calques.forEach(i => { i.alt = ""; i.decoding = "async"; i.sizes = "(max-width: 760px) 178vw, (max-width: 1000px) 112vw, 900px"; photo.appendChild(i); });
  choix.innerHTML = ORDRE.map(m => `<button type="button" data-m="${m}" aria-pressed="false">${esc(METIERS[m].court)}</button>`).join("") + (calme ? "" : '<button type="button" class="pause" data-pause aria-pressed="false">Pause</button>');
  /* arret : le visiteur a choisi un métier ou touché « Pause », la scène ne change plus toute seule */
  let rang = -1, couche = 0, minuteries = [], visible = true, arret = false;
  const boutonPause = $("[data-pause]", choix);
  const arreter = oui => { arret = oui; if (boutonPause) { boutonPause.setAttribute("aria-pressed", oui); boutonPause.textContent = oui ? "Reprendre" : "Pause"; } };
  const plus_tard = (f, ms) => minuteries.push(setTimeout(f, calme ? 0 : ms));
  function poserViseur(m, pris) {
    const [x, y, t, fx = 50] = METIERS[m].qr, w = scene.clientWidth, h = scene.clientHeight;
    const W = Math.max(w, h * 16 / 9), H = Math.max(h, w * 9 / 16);
    if (!pris) { viseur.style.setProperty("--x", "50%"); viseur.style.setProperty("--y", "44%"); viseur.style.setProperty("--t", Math.min(44, 30 * W / w) + "%"); return; }
    viseur.style.setProperty("--x", ((w - W) * fx / 100 + x / 100 * W) / w * 100 + "%");
    viseur.style.setProperty("--y", ((h - H) / 2 + y / 100 * H) / h * 100 + "%");
    viseur.style.setProperty("--t", t * (w < 600 ? 1.45 : 1.75) * W / w + "%");
  }
  function montrer(i, auto) {
    minuteries.forEach(clearTimeout); minuteries = [];
    rang = (i + ORDRE.length) % ORDRE.length;
    const m = ORDRE[rang], M = METIERS[m];
    $$("button[data-m]", choix).forEach(b => b.setAttribute("aria-pressed", b.dataset.m === m));
    tel.classList.remove("la"); viseur.classList.remove("pris"); legende.textContent = "";
    couche = 1 - couche;
    const img = calques[couche];
    img.srcset = `img/photos/${m}_scan_p.webp 800w, img/photos/${m}_scan.webp 1600w`;
    img.src = `img/photos/${m}_scan.webp`;
    img.style.objectPosition = (M.qr[3] || 50) + "% 50%";
    const pret = () => {
      img.onload = img.onerror = null;
      calques[1 - couche].classList.remove("la"); img.classList.add("la");
      poserViseur(m, false);
      /* La fiche se charge pendant que le viseur cherche l'étiquette : elle est prête quand elle monte */
      ecran.src = `img/ecrans/${m}_objet.webp`;
      plus_tard(() => poserViseur(m, true), 450);
      plus_tard(() => viseur.classList.add("pris"), 1500);
      plus_tard(() => { tel.classList.add("la"); legende.textContent = typo(M.legende); }, 1750);
      if (auto && !calme && !arret) plus_tard(() => { if (visible && !arret) montrer(rang + 1, true); }, 7000);
    };
    if (img.complete && img.naturalWidth) pret(); else { img.onload = pret; img.onerror = pret; }
  }
  const relancer = ms => { if (!calme && !arret) plus_tard(() => { if (!arret) montrer(rang + 1, true); }, ms); };
  choix.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if ("pause" in b.dataset) { arreter(!arret); relancer(600); }
    else { arreter(true); montrer(ORDRE.indexOf(b.dataset.m), false); }
  });
  addEventListener("resize", () => { if (rang >= 0 && viseur.classList.contains("pris")) poserViseur(ORDRE[rang], true); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { if (!arret) { minuteries.forEach(clearTimeout); minuteries = []; } } else relancer(2500); });
  /* La scène ne tourne que si on la regarde */
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !visible) relancer(1500); visible = v; }, { threshold: .2 }).observe(scene);
  montrer(0, true);

  /* Ruban d'objets : la liste est doublée pour défiler sans couture */
  const OBJETS = { chaise: "Chaise", perforateur: "Perforateur", fut: "Fût", microscope: "Microscope", ciment: "Sac de ciment", micrometre: "Micromètre", tente: "Tente", tronconneuse: "Tronçonneuse", enceinte: "Enceinte", casque: "Casque", caisse_biere: "Caisse de bouteilles", pneu: "Pneu", verre: "Verre", kit_hygiene: "Kit d'hygiène", taille_haie: "Taille-haie", echelle: "Échelle", groupe: "Groupe électrogène", fraise: "Fraise", peinture: "Peinture", multimetre: "Multimètre", glaciere: "Glacière", tireuse: "Tireuse", table: "Table", pied_coulisse: "Pied à coulisse", scie_plongeante: "Scie plongeante", ventouse: "Ventouse de vitrier", laser: "Laser de chantier", mousse_pu: "Mousse expansive", cales: "Cales de vitrage", silicone: "Silicone", defibrillateur: "Défibrillateur", autolaveuse: "Autolaveuse", brancard: "Brancard", monobrosse: "Monobrosse", oxygene: "Bouteille d'oxygène", aspirateur_dorsal: "Aspirateur dorsal", compresses: "Compresses", lavettes: "Lavettes" };
  const figs = Object.entries(OBJETS).map(([k, n]) => `<figure><img src="img/objets/${k}.webp" alt="${esc(n)}" loading="lazy" width="104" height="104"><img class="puce" src="img/symbole.svg" alt="" width="26" height="26"></figure>`).join("");
  $("#ruban").innerHTML = figs + (calme ? "" : figs.replace(/alt="[^"]*"/g, 'alt=""'));

  /* Le geste, à essayer : un objet d'exemple, et les deux autres écrans qui suivent */
  (function () {
    const E = { stock: 6, seuil: 4, cible: 12, prix: 31, base: 5245, sorties: 0, journal: [], avant: null, compte: 6 };
    const CHANTIERS = ["Chantier Dupont · rénovation", "Résidence Les Pins · lot B", "Maintenance école Jean-Moulin"];
    const nombre = $("#egNombre"), etat = $("#egEtat"), boutons = $("#egBoutons"), compter = $("#egCompter"), compte = $("#egCompte"), annuler = $("#egAnnuler"), fait = $("#egFait");
    const journal = $("#egJournal"), commande = $("#egCommande"), commandeTexte = $("#egCommandeTexte"), valeur = $("#egValeur"), sorties = $("#egSorties"), aCommander = $("#egACommander"), voyant = $("#egVoyantCmd");
    const euros = n => Math.round(n).toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ") + " €";
    const heure = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    let affichee = E.base + E.stock * E.prix, anim = 0, delai = 0;
    function compterJusqua(cible) {
      cancelAnimationFrame(anim);
      if (calme) { affichee = cible; valeur.textContent = euros(cible); return; }
      const depart = affichee, t0 = performance.now();
      const pas = t => { const k = Math.min(1, (t - t0) / 450), e = 1 - Math.pow(1 - k, 3); affichee = depart + (cible - depart) * e; valeur.textContent = euros(affichee); if (k < 1) anim = requestAnimationFrame(pas); };
      anim = requestAnimationFrame(pas);
    }
    function dessiner(neuf) {
      nombre.textContent = E.stock;
      if (neuf) { nombre.classList.remove("bouge"); void nombre.offsetWidth; nombre.classList.add("bouge"); }
      const bas = E.stock <= E.seuil;
      etat.classList.toggle("bas", bas); $("span", etat).textContent = typo(bas ? "Sous le seuil : à commander" : "Disponible");
      $('[data-geste="prendre"]', boutons).disabled = E.stock === 0;
      journal.innerHTML = E.journal.length ? E.journal.slice(0, 4).map((l, i) => `<li class="${i === 0 && neuf ? "neuf" : ""}${l.annule ? " raye" : ""}"><b>${esc(l.quoi)}</b><span>${esc(l.h)} · Thomas · ${esc(l.annule ? "Annulé" : l.detail)}</span><em>${esc(l.qte)}</em></li>`).join("") : typo('<li class="eg-vide">Aucun geste pour l\'instant. Touchez un bouton.</li>');
      commande.hidden = !bas;
      if (bas) commandeTexte.textContent = `${E.cible - E.stock} × Gaine électrique · 100 m, chez Grossiste en électricité (démo). Il reste à relire et à envoyer.`;
      sorties.textContent = E.sorties; sorties.nextSibling.textContent = typo(E.sorties > 1 ? "sorties aujourd'hui" : "sortie aujourd'hui");
      aCommander.textContent = bas ? 1 : 0; voyant.classList.toggle("alerte", bas);
      compterJusqua(E.base + E.stock * E.prix);
    }
    function geste(quoi, detail, qte, change, message) {
      E.avant = { stock: E.stock, sorties: E.sorties };
      change();
      E.journal.unshift({ quoi, detail, qte, h: heure() });
      dessiner(true);
      fait.textContent = message; annuler.hidden = false;
      const barre = $("i", annuler), neuve = barre.cloneNode(); barre.replaceWith(neuve);
      clearTimeout(delai); delai = setTimeout(() => { annuler.hidden = true; E.avant = null; }, 10000);
    }
    $("#essaiGeste").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      const g = b.dataset.geste;
      if (b.dataset.pas) { E.compte = Math.max(0, Math.min(99, E.compte + Number(b.dataset.pas))); compte.textContent = E.compte; }
      else if (g === "prendre") geste("Sortie", CHANTIERS[E.sorties % CHANTIERS.length], "−1", () => { E.stock -= 1; E.sorties += 1; }, "Sortie enregistrée.");
      else if (g === "remettre") geste("Retour au dépôt", "Surplus, pas utilisé", "+1", () => { E.stock = Math.min(99, E.stock + 1); }, "Retour enregistré.");
      else if (g === "compter") { E.compte = E.stock; compte.textContent = E.compte; boutons.hidden = true; compter.hidden = false; annuler.hidden = true; $('[data-geste="valider"]', compter).focus({ preventScroll: true }); }
      else if (g === "fermer") { compter.hidden = true; boutons.hidden = false; }
      else if (g === "valider") {
        const ecart = E.compte - E.stock;
        compter.hidden = true; boutons.hidden = false;
        geste("Comptage", ecart ? `Écart de ${ecart > 0 ? "+" : "−"}${Math.abs(ecart)}, stock corrigé` : "Pas d'écart", String(E.compte), () => { E.stock = E.compte; }, ecart ? "Stock corrigé." : "Compté : pas d'écart.");
      }
      else if (g === "annuler" && E.avant) {
        E.stock = E.avant.stock; E.sorties = E.avant.sorties; E.avant = null; E.journal[0].annule = true;
        clearTimeout(delai); annuler.hidden = true; dessiner(true);
      }
    });
    dessiner(false);
  })();

  /* Une question, un écran */
  (function () {
    const R = [
      { q: "« Où est le perforateur ? »", img: "q_dehors", t: "Ce qui est dehors, et chez qui", alt: "Liste du matériel sorti : un perforateur, sur les chantiers",
        p: "Chaque objet sorti porte un prénom, un chantier ou un client, et une date. La liste de ce qui n'est pas rentré tient sur un écran.", qui: "Écran du responsable et du gérant, dans la démo des artisans" },
      { q: "« Qu'est-ce qu'il faut commander ? »", img: "q_commandes", t: "La commande est déjà préparée", alt: "Écran des commandes : un brouillon prêt pour un fournisseur, avec son total",
        p: "Quand un objet passe sous son seuil, le brouillon se remplit seul, fournisseur par fournisseur. Vous relisez, vous envoyez. Au-dessus d'un montant réglé à l'installation, le gérant valide.", qui: "Écran du responsable, dans la démo des artisans" },
      { q: "« Qu'est-ce qu'on a à faire aujourd'hui ? »", img: "loueur_accueil_bureau", t: "La journée est déjà rangée", alt: "Écran du responsable : départs, retours, livraisons, alertes et liste « À faire »",
        p: "Les départs à préparer, les retours attendus, les livraisons à réceptionner. La liste « À faire » se remplit seule, à partir des gestes du dépôt.", qui: "Écran du responsable, dans la démo de la location" },
      { q: "« Avez-vous 300 chaises le 14 ? »", img: "q_resas", t: "La réponse en dix secondes", alt: "Écran des réservations : pour chaque objet, ce qui est déjà pris et ce qui est libre aux dates choisies",
        p: "Vous choisissez les dates. La réponse tient compte de ce qui est déjà réservé et de ce qui revient d'ici là.", qui: "Écran du responsable, dans la démo de la location" },
      { q: "« Combien vaut ce que j'ai au dépôt ? »", img: "loueur_accueil_direction", t: "L'écran du patron", alt: "Écran du gérant : valeur du matériel, tendance sur 30 jours, part du parc louée",
        p: "La valeur du matériel en grand, ce qui est dehors et chez qui, la casse à refacturer, ce qui n'est pas sorti depuis des mois. Vous pouvez vous absenter : le téléphone vous le dit.", qui: "Écran du gérant, dans la démo de la location" },
      { q: "« Qui a sorti ça, et quand ? »", img: "q_journal", t: "Tout est gardé", alt: "Journal : chaque sortie avec l'objet, le chantier, l'heure et le prénom",
        p: "Chaque geste porte un prénom, une heure et une destination. Une erreur se corrige par un nouveau mouvement, jamais en effaçant.", qui: "Journal, dans la démo des artisans" }
    ];
    const liste = $("#reponsesListe"), image = $("#reponseImage"), titre = $("#reponseTitre"), texte = $("#reponseTexte"), qui = $("#reponseQui");
    liste.innerHTML = R.map((r, i) => `<button type="button" data-i="${i}" aria-pressed="false">${esc(r.q)}</button>`).join("");
    /* proche : la section approche de l'écran. Avant, aucune capture n'est demandée : le premier écran reste léger. */
    let proche = !("IntersectionObserver" in window), courant = 0;
    function choisir(i, anime) {
      const r = R[i]; courant = i;
      $$("button", liste).forEach((b, k) => b.setAttribute("aria-pressed", k === i));
      titre.textContent = typo(r.t); texte.textContent = typo(r.p); qui.textContent = typo(r.qui);
      image.alt = typo(r.alt);
      if (!proche) return;
      const poser = () => { image.src = `img/ecrans/${r.img}.webp`; image.classList.remove("change"); };
      if (anime && !calme) { image.classList.add("change"); setTimeout(poser, 220); } else poser();
    }
    const approcher = () => { if (proche) return; proche = true; choisir(courant, false); };
    avantImpression.push(approcher);
    liste.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      choisir(Number(b.dataset.i), true);
      /* Sur téléphone, l'écran est sous la liste : on y descend */
      if (innerWidth <= 760) $(".reponses-vue").scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "start" });
    });
    choisir(0, false);
    /* L'écran affiché se charge quand la section approche ; les autres juste après, pour que le changement soit immédiat */
    if ("IntersectionObserver" in window) { const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { approcher(); R.forEach(r => { new Image().src = `img/ecrans/${r.img}.webp`; }); o.disconnect(); } }, { rootMargin: "700px" }); o.observe($("#reponses")); }
  })();

  /* Le bureau : la même appli sur ordinateur, dans la démo du métier demandé quand ses captures existent */
  (function () {
    const AVEC = ["loueur", "artisan", "menuisier", "restaurant", "labo", "ambulance", "paysagiste", "proprete", "industrie", "brasserie", "ong"];
    const m = AVEC.includes(prefere) ? prefere : "loueur";
    const V = [
      { c: "direction", t: "Le tableau du gérant", p: "La valeur du matériel, ce qui est dehors, ce qui attend votre accord : tout tient sur un écran.", alt: "Sur ordinateur : le tableau du gérant, avec la valeur du matériel et les voyants du jour" },
      { c: "analyses", t: "Les analyses", p: "Ce qui sort le plus, ce qui dort, les pertes semaine par semaine : les courbes côte à côte.", alt: "Sur ordinateur : la page des analyses, avec plusieurs courbes côte à côte" },
      { c: "stock", t: "Le stock", p: "Tout le stock avec sa zone, la recherche et les filtres, comme dans un tableau.", alt: "Sur ordinateur : la liste du stock avec la zone de chaque objet et la recherche" },
      /* La même capture pour tous les métiers : la démo de trois restaurants */
      { f: "img/ecrans/ordi_groupe.webp", groupe: true, t: "Plusieurs établissements", p: "Plusieurs établissements ? Chacun a son stock et son équipe, et ne voit que le sien. Vous, vous les voyez côte à côte : valeur du stock, pertes, ce qui dort, ce qui est en retard.", alt: "Sur ordinateur : l'écran « Groupe », trois restaurants côte à côte avec la valeur du stock, les pertes et les retards de chacun" }
    ];
    const choix = $("#bureauChoix"), image = $("#bureauImage"), legende = $("#bureauLegende");
    if (!choix) return;
    const fichier = v => v.f || `img/ecrans/ordi_${m}_${v.c}.webp`;
    choix.innerHTML = V.map((v, i) => `<button type="button" data-i="${i}" aria-pressed="false">${esc(v.t)}</button>`).join("");
    let proche = !("IntersectionObserver" in window), courant = 0;
    function choisir(i, anime) {
      const v = V[i]; courant = i;
      $$("button", choix).forEach((b, k) => b.setAttribute("aria-pressed", k === i));
      legende.textContent = typo(v.p);
      if (v.groupe) legende.insertAdjacentHTML("beforeend", ` <a href="${html(lienGroupe)}" target="_blank" rel="noopener">Voir la démo de trois restaurants<span class="hors-ecran"> (nouvel onglet)</span></a>`);
      /* Le téléphone du dépôt, au premier plan, n'a pas sa place devant l'écran du groupe */
      $("#bureauTel").parentNode.hidden = !!v.groupe; $("#bureauNote").hidden = !!v.groupe;
      image.alt = typo(v.alt);
      if (!proche) return;
      const poser = () => { image.src = fichier(v); image.classList.remove("change"); };
      if (anime && !calme) { image.classList.add("change"); setTimeout(poser, 220); } else poser();
    }
    const approcher = () => { if (proche) return; proche = true; $("#bureauTel").src = `img/ecrans/${m}_objet.webp`; choisir(courant, false); };
    avantImpression.push(approcher);
    choix.addEventListener("click", e => { const b = e.target.closest("button"); if (b) choisir(Number(b.dataset.i), true); });
    choisir(0, false);
    if ("IntersectionObserver" in window) { const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { approcher(); V.forEach(v => { new Image().src = fichier(v); }); o.disconnect(); } }, { rootMargin: "700px" }); o.observe($("#bureau")); }
    else $("#bureauTel").src = `img/ecrans/${m}_objet.webp`;
  })();

  /* Grille des métiers */
  $("#grilleMetiers").innerHTML = ORDRE.map(m => `<a class="metier${m === prefere ? " premier" : ""}" href="${html(lienDemo(m))}" target="_blank" rel="noopener">
    <div class="metier-photo"><img src="img/photos/${m}_hero_p.webp" alt="" loading="lazy" decoding="async" width="800" height="450"></div>
    <div class="metier-texte"><h3>${esc(METIERS[m].nom)}</h3><p>${esc(METIERS[m].geste)}</p><b>Ouvrir la démo<span class="hors-ecran"> (nouvel onglet)</span></b></div></a>`).join("");

  /* Moyens de contact réglés dans config.js. Le formulaire ne s'affiche que s'il peut partir : il lui faut une adresse ou un service de formulaire.
     Avec un téléphone ou WhatsApp seulement, la rubrique Contact montre le numéro, sans formulaire. Sans rien, tout ce qui mène au contact est retiré. */
  const propre = v => String(v == null ? "" : v).trim();
  const K = { email: /^\S+@\S+\.\S+$/.test(propre(C.email)) ? propre(C.email) : "", formulaire: /^https:\/\//.test(propre(C.formulaire)) ? propre(C.formulaire) : "",
              telephone: propre(C.telephone), whatsapp: propre(C.whatsapp).replace(/\D/g, "") };
  const aFormulaire = !!(K.email || K.formulaire), aContact = aFormulaire || !!K.telephone || !!K.whatsapp;
  const lienTel = "tel:" + K.telephone.replace(/[^\d+]/g, "");
  const lienWhatsApp = texte => "https://wa.me/" + K.whatsapp + (texte ? "?text=" + encodeURIComponent(texte) : "");
  document.documentElement.classList.toggle("sans-contact", !aContact);
  document.documentElement.classList.toggle("sans-formulaire", aContact && !aFormulaire);

  /* Questionnaire */
  const QUESTIONS = [
    { cle: "metier", q: "Quelle est votre activité ?",
      o: ORDRE.map(m => [m, METIERS[m].nom]).concat([["autre", "Une autre activité", "Nous trouvons la démo la plus proche"]]) },
    { cle: "stock", q: "Que stockez-vous surtout ?",
      o: [["pret", "Du matériel qui part et qui revient", "Outils, machines, matériel loué ou prêté"],
          ["conso", "Du stock qui se consomme ou se vend", "Fournitures, produits, pièces, denrées"],
          ["mixte", "Les deux"]] },
    { cle: "douleur", q: "Qu'est-ce qui vous coûte le plus aujourd'hui ?",
      o: [["perdu", "Du matériel qui ne revient pas", "On ne sait plus qui l'a, ni depuis quand"],
          ["rupture", "Les ruptures", "On découvre qu'il en manque quand il est trop tard"],
          ["inventaire", "L'inventaire", "Il prend des jours et il est faux le lendemain"],
          ["valeur", "Ne pas savoir ce que j'ai", "Ni ce que ça vaut, ni ce qui dort"],
          ["casse", "La casse et les pertes", "Jamais refacturées, jamais comptées"]] },
    { cle: "equipe", q: "Combien de personnes touchent au stock ?",
      o: [["seul", "Moi seul"], ["petite", "De 2 à 5 personnes"], ["moyenne", "De 6 à 20 personnes"], ["grande", "Plus de 20, ou plusieurs sites"]] }
  ];
  const REGARDER = {
    perdu: ["Ce qui est dehors, et chez qui", "Chaque objet sorti porte un nom et une date. Entrez comme responsable et ouvrez la liste de ce qui est dehors."],
    rupture: ["Commander avant la rupture", "Quand un article passe sous son seuil, il apparaît dans « À commander » et la commande se prépare."],
    inventaire: ["Compter en quelques minutes", "On scanne l'étagère, on tape le nombre : l'écart s'affiche, le stock est corrigé."],
    valeur: ["L'écran du patron", "Entrez comme gérant : la valeur du stock, ce qui sort le plus, ce qui dort depuis des mois."],
    casse: ["La casse, notée au retour", "Un objet revient abîmé : on le dit en un geste, et le relevé de casse se prépare seul."]
  };
  const FORMULES = {
    depot: ["Dépôt suivi", "Ce qui entre, ce qui sort, ce qui manque."],
    metier: ["Métier suivi", "Sorties, retours, commandes, chiffres du patron et l'écran propre à votre activité."],
    mesure: ["Sur mesure", "Plusieurs sites ou une grande équipe : nous partons de votre organisation."]
  };
  const quiz = $("#quiz"), champReponses = $("#champReponses"), champDemande = $("#champDemande"), caseEssai = $("#caseEssai"), joint = $("#formJoint");
  let R = {}, pas = 0;
  /* Les réponses sont gardées le temps de la visite : revenir de la démo ne fait pas tout recommencer */
  try { const garde = JSON.parse(memoire.lire("stockclair-quiz") || "null"); if (garde && garde.R && QUESTIONS.every((q, i) => i >= garde.pas || q.o.some(o => o[0] === garde.R[q.cle]))) { R = garde.R; pas = Math.min(garde.pas, QUESTIONS.length); } } catch (e) { /* réponses illisibles : on repart de zéro */ }
  if (prefere && !pas) { R.metier = prefere; pas = 1; }
  function metierRetenu() {
    if (R.metier !== "autre") return R.metier;
    return R.stock === "pret" ? "loueur" : R.stock === "conso" ? "distribution" : "artisan";
  }
  function formuleRetenue() {
    if (R.equipe === "grande") return "mesure";
    return (R.stock !== "conso" || R.equipe === "moyenne") ? "metier" : "depot";
  }
  /* Le résumé joint au message : les quatre réponses, la démo proposée et la formule conseillée */
  function resume() {
    const lib = (cle) => { const q = QUESTIONS.find(x => x.cle === cle), o = q.o.find(x => x[0] === R[cle]); return o ? o[1] : ""; };
    return `Activité : ${lib("metier")}\nStock : ${lib("stock")}\nCe qui coûte le plus : ${lib("douleur")}\nÉquipe : ${lib("equipe")}\nDémo proposée : ${METIERS[metierRetenu()].nom}\nFormule conseillée : ${FORMULES[formuleRetenue()][0]}`;
  }
  /* Ce qui part avec le message est montré au visiteur, sous le formulaire */
  function joindre() {
    const fini = pas >= QUESTIONS.length;
    champReponses.value = fini ? resume() : "";
    joint.hidden = !fini;
    if (fini) joint.textContent = typo("Vos réponses au questionnaire partent avec le message :\n" + resume());
  }
  function suite() {
    if (!aContact) return "";
    if (aFormulaire) return `<div class="quiz-suite"><p><b>Et ensuite ?</b> Recevez votre prix par écrit, ou demandez l'essai de 14 jours sur vos propres articles. Vos quatre réponses partent avec le message : nous préparons la démonstration qui vous correspond.</p>
        <div class="actions"><a class="btn grand" href="#contact" data-suite="prix">Recevoir mon prix par écrit</a><a class="btn grand" href="#contact" data-suite="essai">Demander mon essai</a></div></div>`;
    const message = "Bonjour, je viens de répondre au questionnaire du site Stockclair et je souhaite une démonstration.\n\n" + resume();
    return `<div class="quiz-suite"><p><b>Et ensuite ?</b> Parlons-en un quart d'heure : nous vous montrons cette démo sur vos objets, puis vous recevez votre prix par écrit.</p>
        <div class="actions">${K.telephone ? `<a class="btn grand" href="${html(lienTel)}">Appeler le ${esc(K.telephone)}</a>` : ""}${K.whatsapp ? `<a class="btn grand" href="${html(lienWhatsApp(message))}" target="_blank" rel="noopener">Écrire sur WhatsApp</a>` : ""}</div></div>`;
  }
  function dessiner() {
    memoire.ecrire("stockclair-quiz", JSON.stringify({ R, pas }));
    const fini = pas >= QUESTIONS.length;
    joindre();
    const barre = `<div class="quiz-avance">${QUESTIONS.map((_, i) => `<i class="${i < pas ? "fait" : ""}"></i>`).join("")}<span>${fini ? "Votre démo" : `Question ${pas + 1} sur ${QUESTIONS.length}`}</span></div>`;
    if (!fini) {
      const q = QUESTIONS[pas];
      quiz.innerHTML = typo(barre + `<h3 tabindex="-1">${esc(q.q)}</h3><div class="quiz-options">${q.o.map(o => `<button type="button" data-v="${o[0]}" aria-pressed="${R[q.cle] === o[0]}"${R[q.cle] === o[0] ? ' class="choisi"' : ""}>${esc(o[1])}${o[2] ? `<small>${esc(o[2])}</small>` : ""}</button>`).join("")}</div>${pas ? '<button type="button" class="quiz-retour" data-retour>Question précédente</button>' : ""}`);
      return;
    }
    const m = metierRetenu(), M = METIERS[m], f = FORMULES[formuleRetenue()], r = REGARDER[R.douleur];
    quiz.innerHTML = typo(barre + `<div class="quiz-resultat"><div>
      <h3 tabindex="-1">Votre démo : ${esc(M.nom.toLowerCase())}.</h3>
      <p>${esc(R.metier === "autre" ? "C'est la démo la plus proche de votre activité. Vos objets et vos mots remplaceront ceux de l'exemple." : "Elle s'ouvre au nom d'une entreprise fictive de votre métier, avec une visite guidée de deux minutes.")}</p>
      <ul class="quiz-points">
        <li><div><b>${esc(r[0])}</b>${esc(r[1])}</div></li>
        <li><div><b>Le geste de votre métier</b>${esc(M.geste)}</div></li>
        <li><div><b>${esc("Formule conseillée : " + f[0])}</b>${esc(f[1])}</div></li>
        ${R.equipe === "grande" ? `<li><div><b>Plusieurs établissements ?</b>Chacun a son stock et son équipe ; vous, vous les voyez côte à côte. <a href="${html(lienGroupe)}" target="_blank" rel="noopener">Voir la démo de trois restaurants<span class="hors-ecran"> (nouvel onglet)</span></a></div></li>` : ""}
      </ul>
      <div class="actions"><a class="btn plein grand" id="quizOuvrir" href="${html(lienDemo(m))}" target="_blank" rel="noopener">Ouvrir ma démo<span class="hors-ecran"> (nouvel onglet)</span></a></div>
      <p class="note quiz-note">${esc("Sur téléphone, choisissez ensuite « Ajouter à l'écran d'accueil » : la démo s'installe comme une appli.")}</p>
      ${suite()}
      <button type="button" class="quiz-retour" data-recommencer>Recommencer</button>
    </div><figure class="capture vivant" id="quizTel"><img src="img/ecrans/${m}_accueil_direction.webp" alt="${esc("Écran du gérant dans la démo : " + M.nom.toLowerCase())}" width="540" height="1169"><button type="button" class="btn plein essayer" data-vivant>Essayer ici</button></figure></div>`);
  }
  quiz.addEventListener("click", e => {
    const b = e.target.closest("button, a"); if (!b) return;
    const viser = () => { const h = $("h3", quiz); if (h) h.focus({ preventScroll: true }); };
    if (b.dataset.v) { R[QUESTIONS[pas].cle] = b.dataset.v; pas++; dessiner(); viser(); }
    else if ("retour" in b.dataset) { pas--; dessiner(); viser(); }
    else if ("recommencer" in b.dataset) { R = {}; pas = 0; dessiner(); viser(); }
    else if ("vivant" in b.dataset) {
      const t = $("#quizTel"), k = t.clientWidth / 390;
      t.style.height = Math.round(844 * k) + t.offsetHeight - t.clientHeight + "px";
      t.innerHTML = `<iframe title="Démonstration Stockclair" src="${html(lienDemo(metierRetenu()))}" style="transform:scale(${k})" allow="camera"></iframe>`;
    }
    else if (b.dataset.suite) { champDemande.value = b.dataset.suite; caseEssai.checked = b.dataset.suite === "essai"; }
  });
  dessiner();

  /* Essai : paiement en ligne seulement si un lien est fourni dans config.js */
  const essai = $("#essaiBouton");
  if (/^https:\/\//.test(propre(C.paiementEssai))) { essai.href = propre(C.paiementEssai); essai.textContent = "Commander mon essai"; essai.target = "_blank"; essai.rel = "noopener"; $("#essaiNote").textContent = typo("Le prix de l'essai est déduit de votre commande."); }
  else essai.addEventListener("click", () => { caseEssai.checked = true; champDemande.value = "essai"; });

  /* Facturation par la société de portage : affichée seulement une fois la convention signée */
  if (propre(C.portage)) { const p = $("#quiFacture"); p.hidden = false; p.textContent = typo(`En France, la facture vous est adressée par ${propre(C.portage)}, société française de portage salarial : votre paiement passe par une entreprise établie.`); }

  /* Questions : la même liste, lisible par les moteurs de recherche */
  const faq = $$("#faq details").map(d => ({ "@type": "Question", name: $("summary", d).textContent.trim(), acceptedAnswer: { "@type": "Answer", text: $("p", d).textContent.trim() } }));
  const balise = document.createElement("script"); balise.type = "application/ld+json";
  balise.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq });
  document.head.appendChild(balise);

  /* Rubrique Contact : les moyens réglés, dans l'ordre où l'on répond le plus vite */
  const contacts = [];
  if (K.telephone) contacts.push(`<li><a href="${html(lienTel)}">${esc(K.telephone)}</a></li>`);
  if (K.email) contacts.push(`<li><a href="mailto:${html(K.email)}">${html(K.email)}</a><small>Réponse sous deux jours ouvrés</small></li>`);
  if (K.whatsapp) contacts.push(`<li><a href="${html(lienWhatsApp(""))}" target="_blank" rel="noopener">WhatsApp</a><small>Le plus rapide pour une question courte</small></li>`);
  $("#contacts").innerHTML = contacts.join("");
  if (aContact && !aFormulaire) $("#contactTexte").textContent = typo("Dites-nous ce que vous stockez et ce qui vous fait perdre du temps ou de l'argent. En un quart d'heure, nous vous montrons la démo de votre métier sur vos propres objets, puis vous recevez votre prix par écrit.");

  /* Formulaire de contact */
  const form = $("#formContact"), etat = $("#formEtat");
  const dire = (texte, copie) => {
    etat.textContent = typo(texte);
    if (!copie) return;
    /* Si aucune messagerie ne s'ouvre, le visiteur peut coller le message dans la sienne */
    const b = document.createElement("button"); b.type = "button"; b.className = "lien"; b.textContent = "Copier le message";
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(copie); b.textContent = "Message copié"; }
      catch (err) { const z = document.createElement("textarea"); z.value = copie; z.readOnly = true; z.rows = 8; z.setAttribute("aria-label", "Votre message, à copier"); b.replaceWith(z); z.select(); }
    });
    etat.append(" ", b);
  };
  form.addEventListener("submit", async e => {
    e.preventDefault();
    let ok = true;
    $$("[required]", form).forEach(c => { const vide = !c.value.trim(); c.classList.toggle("faux", vide); c.setAttribute("aria-invalid", vide); if (vide) ok = false; });
    if (!ok) { dire("Il manque votre nom, votre entreprise ou un moyen de vous répondre."); $(".faux", form).focus(); return; }
    const d = Object.fromEntries(new FormData(form).entries());
    const prix = d.demande === "prix";
    const sujet = (d.essai ? "Demande d'essai de 14 jours" : prix ? "Demande de prix par écrit" : "Demande de démonstration") + " · " + d.entreprise.trim();
    const souhait = [d.essai ? "l'essai de 14 jours sur mes articles" : "", prix ? "mon prix par écrit" : ""].filter(Boolean).join(", et ") || "une démonstration";
    const corps = `Je souhaite : ${souhait}\n\nNom : ${d.nom.trim()}\nEntreprise : ${d.entreprise.trim()}\nPour me répondre : ${d.joindre.trim()}${d.message.trim() ? "\n\n" + d.message.trim() : ""}${d.reponses ? "\n\nMes réponses au questionnaire\n" + d.reponses : ""}`;
    const secours = K.email ? "Écrivez-nous directement : " + K.email + "." : K.telephone ? "Appelez-nous : " + K.telephone + "." : "Réessayez dans un instant.";
    if (K.formulaire) {
      dire("Envoi en cours…");
      const charge = { _subject: sujet, sujet, message: corps, nom: d.nom.trim(), entreprise: d.entreprise.trim(), joindre: d.joindre.trim() };
      if (/^\S+@\S+\.\S+$/.test(d.joindre.trim())) charge.email = d.joindre.trim();
      try {
        const r = await fetch(K.formulaire, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(charge) });
        if (!r.ok) throw new Error(r.status);
        form.reset(); champDemande.value = ""; dire("Message envoyé. Nous vous répondons sous deux jours ouvrés.");
      } catch (err) { dire("L'envoi n'a pas abouti. " + secours, "Objet : " + sujet + "\n\n" + corps); }
      return;
    }
    location.href = `mailto:${K.email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
    dire("Votre messagerie s'ouvre avec le message prêt : il reste à l'envoyer. Si rien ne s'ouvre, copiez-le et envoyez-le à " + K.email + ".", "Objet : " + sujet + "\n\n" + corps);
  });

  /* Les autres supports d'étiquettes : la rangée est ouverte sur ordinateur, repliée sur tablette et sur téléphone ; un lien « Voir les supports » l'ouvre */
  const supports = $("#supports");
  if (supports) {
    if (innerWidth > 1000) supports.open = true;
    const ouvrir = () => { if (location.hash === "#supports") supports.open = true; };
    document.addEventListener("click", e => { if (e.target.closest('a[href="#supports"]')) supports.open = true; });
    addEventListener("hashchange", ouvrir); ouvrir();
  }

  /* Impression : toutes les réponses ouvertes, toutes les images chargées */
  addEventListener("beforeprint", () => {
    avantImpression.forEach(f => f());
    $$("#faq details").forEach(d => { if (!d.open) { d.open = true; d.dataset.imprime = "1"; } });
    $$('img[loading="lazy"]').forEach(i => { i.loading = "eager"; });
  });
  addEventListener("afterprint", () => { $$("#faq details[data-imprime]").forEach(d => { d.open = false; delete d.dataset.imprime; }); });

})();
