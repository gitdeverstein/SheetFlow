# SheetFlow

SheetFlow est une application CRM / tableur en monorepo destinée aux PME. Elle gère les clients, les stocks et les devis via une interface de type tableur avec des opérations CRUD complètes, un moteur de formules, l'export PDF/Excel et des tableaux de bord KPI en temps réel.

## Structure du projet

```
sheetflow/
├── apps/
│   ├── backend/          # Serveur API Hono (Node.js)
│   └── frontend/         # SPA React (Vite + Tailwind CSS)
├── packages/
│   ├── db/               # Schéma Drizzle ORM, migrations, données de test
│   └── shared/           # Schémas Zod + types TypeScript partagés
├── .env                  # Configuration d'environnement
└── package.json          # Racine du workspace
```

## Technologies

| Couche | Technologie |
|---|---|
| Frontend | React 19, TypeScript, Vite, Zustand 5, Tailwind CSS 4, Framer Motion, Lucide React, react-window |
| Backend | Hono 4 (Node.js), Drizzle ORM, PostgreSQL, Zod, Pino |
| Export | jsPDF + jspdf-autotable (PDF), SheetJS / xlsx (Excel) |
| Monorepo | npm workspaces |

## Prérequis

- Node.js (v20+)
- PostgreSQL (v15+)
- npm (v10+)

## Installation et configuration

1. **Cloner le dépôt et installer les dépendances :**
   ```bash
   git clone <url-du-depot>
   cd sheetflow
   npm install
   ```

2. **Configurer l'environnement :**
   Créer `apps/backend/.env` à partir de `.env.example` :
   ```env
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/sheetflow
   PORT=3000
   ALLOWED_ORIGINS=http://localhost:5173
   ```

3. **Initialiser la base de données :**
   ```bash
   npm run db:push -w @sheetflow/db
   npm run db:seed -w @sheetflow/db
   ```

4. **Lancer le développement :**
   ```bash
   npm run dev
   ```
   - **Frontend :** http://localhost:5173
   - **Backend :** http://localhost:3000

## Fonctionnalités

### Écran d'accueil et authentification
- Écran de bienvenue avec branding SheetFlow
- Onglets « Sign in » et « Sign up » avec formulaire dédié
- Transitions glissantes animées (Framer Motion `AnimatePresence`)
- Fond animé avec orbes flottantes
- Mode invité sans authentification

### CRM (Gestion de la relation client)
- CRUD complet pour les contacts (nom, email, téléphone, entreprise, notes)
- Suivi du statut : Actif / Prospect / Inactif
- Édition en ligne via une grille avec listes déroulantes
- Filtrage et tri des colonnes avec indicateurs visuels

### Gestion des stocks
- CRUD complet des produits avec SKU, quantité, seuils d'alerte, prix
- Surveillance des niveaux de stock avec alertes de rupture dans le tableau de bord
- Déduction automatique des stocks lors de l'acceptation d'un devis
- Restauration des stocks lors du rejet d'un devis accepté
- Ajustement delta lors de la modification d'un devis accepté
- **Import en masse via CSV** : bouton « Import CSV » dans l'onglet Inventaire — colonnes attendues : `sku`, `name`, `stock`, `alertThreshold`, `price`. Les SKU existants sont mis à jour (upsert), les nouveaux sont créés.

### Génération de devis
- Création et édition de devis avec lignes dynamiques
- Recherche et autocomplétion dans les sélecteurs client et produit
- Prix automatiquement issus du catalogue
- Totaux en temps réel (sous-total + TVA 20 %)
- Cycle de vie : Brouillon → Envoyé → Accepté / Refusé
- Confirmation avant passage en « Accepté »
- **Champ Notes** : notes internes optionnelles par devis, incluses dans l'export PDF
- **Duplication de devis** : cloner un devis existant en Brouillon via le bouton « Dupliquer » dans le tableau de bord
- Export PDF (A4 avec tableau détaillé, totaux et notes)
- Export Excel (.xlsx avec données structurées)

### Tableau de bord
- Cartes KPI animées (chiffre d'affaires, nombre de clients, nombre de produits, alertes de stock)
- **Graphique donut SVG** des statuts de devis (Brouillon / Envoyé / Accepté / Refusé), sans dépendance externe
- **Badge d'expiration** : les devis dont la date de validité est dépassée affichent un badge « Expired » en rouge
- **Panel Top Customers** : classement des clients par nombre de devis, avec lien rapide vers leurs devis
- Tableau des devis récents avec mise à jour du statut en ligne
- Liste de surveillance des stocks faibles
- Export PDF et Excel en un clic par devis
- Apparition progressive échelonnée des cartes
- Squelettes de chargement (skeleton loading) pendant le chargement des données

### Moteur de formules
- Grille éditable avec modification cellule par cellule
- Navigation au clavier (flèches et Tab)
- Moteur de formules prenant en charge les opérations arithmétiques, `SUM`, `MOYENNE`, les références de cellules et les plages
- Recalcul topologique avec détection des références circulaires
- Graphe de dépendances et recalculs avec débounce

### Animations et expérience utilisateur
- Transitions fluides entre les écrans (Framer Motion)
- Apparition graduelle du contenu avec décalage temporel
- Squelettes de chargement animés (pulse) pour chaque section
- Navigation clavier dans la grille (flèches directionnelles, Tab)
- Barre de recherche et autocomplétion dans les sélecteurs
- Virtualisation des lignes de la grille (react-window) pour les grands jeux de données
- Toasts de notification pour les actions réussies ou en erreur

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Lance le backend + frontend simultanément |
| `npm run build` | Compile tous les paquets pour la production |
| `npm run db:push` | Pousse le schéma Drizzle vers la base de données |
| `npm run db:seed` | Initialise la base de données avec des données d'exemple |

## API — Nouveaux endpoints

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/quotes/:id/duplicate` | Duplique un devis existant en Brouillon |
| `POST` | `/api/inventory/import` | Import en masse (upsert sur SKU) — body : tableau JSON |

### Format CSV pour l'import inventaire

```csv
sku,name,stock,alertThreshold,price
WGT-001,Premium Widget,50,10,149.99
ACC-001,USB-C Hub,200,30,34.99
```

## Notes d'architecture

- **Backend :** Framework Hono avec validation Zod (`@hono/zod-validator`), journalisation structurée Pino et gestion centralisée des erreurs. CORS configuré de manière stricte (origines explicites uniquement).
- **Base de données :** Drizzle ORM avec contraintes PostgreSQL et transactions multi-tables pour l'intégrité des données. Clés UUID pour les identifiants. Migrations versionnées dans `packages/db/drizzle/`.
- **Frontend :** Zustand pour la gestion d'état avec helpers `buildCrmRow`/`buildInvRow` garantissant la cohérence entre le store `customers`/`inventory` et les lignes de grille `rows.crm`/`rows.inventory`. Toutes les mutations synchronisent l'état local immédiatement après confirmation du serveur.
- **Validation :** Schémas Zod partagés dans `@sheetflow/shared` utilisés par le frontend et le backend avec `zValidator` middleware.
- **Transactions :** Les opérations métier critiques (acceptation de devis, gestion des stocks) utilisent des transactions avec prévention des interblocages (tri des productId avant acquisition des verrous `FOR UPDATE`) et ajustements delta.
- **Cohérence des données :** Les suppressions de clients nettoient les devis en cascade côté store. Les changements de statut de devis et suppressions déclenchent un rechargement de l'inventaire pour refléter les ajustements de stock.
