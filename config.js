/* Réglages du site Stockclair. C'est le seul fichier à modifier pour changer un contact ou un lien.
   Une valeur laissée vide ("") masque l'élément correspondant sur le site.
   Tant que les quatre réglages de contact sont vides, la rubrique Contact et les boutons qui y mènent n'apparaissent pas. */
window.STOCKCLAIR = {
  // Adresse de la démonstration en ligne (avec la barre oblique finale)
  demo: "https://nexuxstelar.github.io/rayon-demo-publique/",

  // Contact
  email: "contact@stockclair.com",        // fait apparaître le formulaire ; reprise dans les pages légales
  whatsapp: "",                              // numéro au format international sans + ni espaces, par exemple 33612345678
  telephone: "",                             // affiché tel quel, par exemple "06 12 34 56 78". Repris dans les mentions légales

  // Formulaire : adresse (https://…) d'un service qui reçoit les demandes, par exemple Formspree (https://formspree.io/f/…).
  // Vide : le formulaire ouvre la messagerie du visiteur avec le message déjà rédigé, à l'adresse « email ».
  // Sans « email » ni « formulaire », le formulaire ne s'affiche pas : la rubrique Contact montre seulement le téléphone ou WhatsApp.
  formulaire: "",

  // Essai payant en ligne : lien de paiement (https://…) fourni par la société de portage ou par un service de paiement.
  // Vide : l'essai se demande par le formulaire, sans paiement en ligne.
  paiementEssai: "",

  // Facturation en France : nom de la société de portage une fois la convention signée.
  // Vide : le site ne parle pas de la facturation.
  portage: ""
};
