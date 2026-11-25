# Faisceau

Jeu de réflexion en 2D. Un faisceau laser entre par E et doit ressortir par S. Le joueur place des pièces optiques sur le plateau pendant un compte à rebours, puis le laser s'allume : sortie atteinte, niveau suivant ; mur touché, on rejoue.

## Jouer

Ouvrir `index.html` dans un navigateur. Un seul fichier, aucune installation.

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
- `template.html` + `build.js` : assemblage de `index.html` (`node tools/build.js`)
