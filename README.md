# Faisceau

Jeu de réflexion en 2D. Un faisceau laser entre par E et doit ressortir par S. Le joueur place des pièces optiques sur le plateau pendant un compte à rebours, puis le laser s'allume : sortie atteinte, niveau suivant ; mur touché, on rejoue.

## Jouer

En ligne : https://cumulos.github.io/faisceau/

Le même code tourne sur iPhone, Android et PC. C'est une application web installable (PWA), jouable hors ligne après la première visite.

| Plateforme | Installation |
|---|---|
| iPhone, iPad | Safari, bouton Partager, « Sur l'écran d'accueil » |
| Android | Chrome, bouton « Installer l'application » dans le jeu ou menu « Installer » |
| PC, Mac | Chrome ou Edge, icône d'installation dans la barre d'adresse ou bouton dans le jeu |

Au clavier : Espace lance l'action, les chiffres choisissent une pièce, le clic droit en retire une.

Après une modification, augmenter le numéro de `CACHE` dans `sw.js` pour que les appareils installés reçoivent la mise à jour.

## Pièces

| Pièce | Effet |
|---|---|
| Miroir | Renvoie le faisceau à 90°, des deux côtés |
| Miroir sans tain | Réfléchit sur une face, laisse passer par l'autre |
| Prisme | Décale le faisceau d'une case en diagonale |
| Séparateur | Laisse passer le faisceau et en renvoie une copie à 90° |
| Diviseur en T | Coupe le faisceau en deux, à gauche et à droite |
| Fibre optique | Deux extrémités : entrée par l'une, sortie par l'autre |
| Diffracteur | Sépare la lumière blanche en rouge (à gauche), vert (tout droit) et bleu (à droite) |
| Piège à lumière | Absorbe un faisceau sans faire échouer le tir |
| Filtres rouge, vert, bleu | Laissent passer leur couleur, teintent le blanc, absorbent le reste |

Les balises (cercles en pointillés) doivent être traversées avant la sortie.

À partir du niveau 31, la source est blanche. Chaque sortie colorée n'accepte que sa couleur, et une balise colorée doit être traversée par cette couleur.

## Niveaux

64 niveaux, chacun avec une solution unique vérifiée par un solveur exhaustif. Les niveaux 1 à 30 sont en lumière rouge, les niveaux 31 à 64 en couleur.

## Outils (`tools/`)

- `engine.js` : moteur de tracé du faisceau et solveur
- `gen.js` : générateur d'un niveau (`node gen.js <index> <graine> <budget ms>`, sortie dans `tools/lv/`)
- `gen-couleur.js` : générateur des niveaux en couleur, mêmes arguments, sortie dans `tools/lv/c<index>.json`
- `levels.json` : les 64 niveaux et leurs solutions
- `manifest.json`, `sw.js`, `icons/` (à la racine) : installation et cache hors ligne
- `template.html` + `build.js` : assemblage de `index.html` (`node tools/build.js`)
