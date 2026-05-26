# HubHex — Guide utilisateur

## Connexion

1. Ouvrir http://localhost:3000
2. Aller sur **Connexion** pour s'inscrire ou se connecter
3. Mot de passe oublie : un email est envoye si SMTP est configure ; sinon le token peut apparaitre en mode developpement

## Mes depots

- Creer un depot avec titre, identifiant (`username/slug`), description et technologies
- **Templates** : en bas du formulaire de creation, choisir un modele (ex. « Application web full-stack ») pour pre-remplir taches et description
- Onglets par depot :
  - **Fichiers** : arborescence, import, double-clic ou bouton **Editer** pour modifier un fichier texte
  - **Kanban** : glisser-deposer les taches entre colonnes
  - **Stack** : technologies avec lien, statut et snippet
  - **Journal** : decisions techniques datees
  - **Notes** : notes techniques separees de la description
  - **Parametres** : visibilite public/prive

## Graphe HubHex

Menu **Graphe** : reliez vos depots (meme techno, inspire de, suite de…) pour visualiser la capitalisation entre projets.

## Communaute

- Parcourir les depots **publics**
- Rechercher par mot-cle, filtrer par technologie, trier par recent ou populaire
- Commenter (suppression par auteur ou proprietaire du projet)

## Profil

- Pseudo, statut, photo (max 2 Mo)
- Modifier email / mot de passe / supprimer le compte
- Profils publics : `/utilisateurs/nom-utilisateur`

## Premier compte

Aucun compte n'est cree automatiquement. Sur **Connexion**, utilisez **S'inscrire** avec un mot de passe fort (majuscule, minuscule, chiffre, symbole).

Demarrage local : voir [CHECKLIST_DEMARRAGE_LOCAL.md](CHECKLIST_DEMARRAGE_LOCAL.md).
