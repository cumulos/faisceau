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

Les balises (cercles jaunes) doivent être traversées avant la sortie.

## Niveaux

30 niveaux, chacun avec une solution unique vérifiée par un solveur exhaustif.

## Outils (`tools/`)

- `engine.js` : moteur de tracé du faisceau et solveur
- `gen.js` : générateur d'un niveau (`node gen.js <index> <graine> <budget ms>`, sortie dans `tools/lv/`)
- `levels.json` : les 30 niveaux et leurs solutions
- `manifest.json`, `sw.js`, `icons/` (à la racine) : installation et cache hors ligne
- `template.html` + `build.js` : assemblage de `index.html` (`node tools/build.js`)
