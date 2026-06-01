# Scenario de demonstration (5–10 min)

**Checklist jour J** (demarrage, livrables, securite) : [CHECKLIST_JOUR_J.md](CHECKLIST_JOUR_J.md)

Support slides : [SOUTENANCE.md](SOUTENANCE.md) — grille orale : [ORAL_GRILLE_B1.md](ORAL_GRILLE_B1.md)

---

## Accroche (30 s)

> HubHex n'est pas seulement un gestionnaire de taches : c'est un hub ou chaque depot est heberge sur la plateforme, avec une stack documentee, un journal de decisions et un graphe qui relie vos projets dans le temps.

---

## Preparation

Utilisez **votre compte** cree sur http://localhost:3000/connexion (inscription si besoin). Preparez a l'avance :

- Un depot avec quelques taches Kanban
- Au moins un depot en **public** pour la communaute
- Optionnel : un second depot pour le graphe

**Session** : pendant la demo, le front renouvelle le JWT access **en silence** (toutes les ~14 min + retry sur 401) via `AuthContext` — pas besoin de vous reconnecter sauf apres 7 jours ou logout.

---

## Parcours complet (10 etapes, ~7–8 min)

| # | Etape | Duree | Action |
|---|--------|-------|--------|
| 0 | Accroche | 30 s | Phrase ci-dessus |
| 1 | **Accueil** (optionnel) | 30 s | http://localhost:3000 — landing si non connecte ; sinon redirection tableau de bord |
| 2 | **Connexion** | 45 s | Email / mot de passe → espace connecte |
| 3 | **Tableau de bord** | 45 s | Activite, compteurs, vue d'ensemble |
| 4 | **Nouveau depot (template)** | 60 s | Ex. « Application web full-stack » |
| 5 | **Fichiers** | 60 s | Importer ou editer un fichier texte (Monaco) |
| 6 | **Kanban** | 45 s | Glisser une tache vers « Termine » |
| 7 | **Stack** | 45 s | Ajouter une techno + lien + snippet |
| 8 | **Journal** | 45 s | Entree de decision |
| 9 | **Graphe** | 60 s | Lier deux depots (ex. « meme techno ») |
| 10 | **Communaute** | 60 s | Projet public, laisser un commentaire |
| 11 | **Profil** | 30 s | Pseudo / avatar |

**Total cible** : 7–8 min (marge pour questions : rester sous 10 min en sautant l'accueil ou le journal).

### Phrase jury (refresh, si on vous le demande)

> « L'access token dure 15 minutes ; le refresh de 7 jours tourne en base. Le front appelle `/api/auth/refresh` automatiquement — l'utilisateur ne voit rien tant que la session est valide. »

---

## Variante courte (6 etapes, ~5 min)

Pour creneau serre ou reseau lent :

| # | Etape | Duree | Inclut |
|---|--------|-------|--------|
| 1 | Connexion | 45 s | Depuis `/connexion` (ou accueil → Connexion) |
| 2 | Dashboard + depot | 90 s | Template rapide |
| 3 | Kanban + fichier | 90 s | Un drag + un fichier ou note |
| 4 | Differentiation | 60 s | **Stack** *ou* **Journal** (un seul) |
| 5 | Graphe *ou* Communaute | 90 s | Un lien graphe **ou** commentaire public |
| 6 | Profil | 30 s | Pseudo / avatar |

Omettre : accueil marketing, deuxieme depot graphe, stack *et* journal.

---

## Checklist avant soutenance

- [ ] PostgreSQL demarre, base `hubhex` existante
- [ ] Backend + frontend demarres (voir [CHECKLIST_DEMARRAGE_LOCAL.md](CHECKLIST_DEMARRAGE_LOCAL.md))
- [ ] Compte personnel pret avec au moins un depot public
- [ ] Parcours teste une fois de bout en bout
- [ ] [CHECKLIST_JOUR_J.md](CHECKLIST_JOUR_J.md) cochee le matin
- [ ] Slides [SOUTENANCE.md](SOUTENANCE.md) relues
