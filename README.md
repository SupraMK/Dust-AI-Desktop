<div align="center">

<img src="assets/icon.png" width="100" height="100" style="border-radius: 22px" />

# Dust AI — Desktop App

> Client desktop macOS non officiel pour [Dust AI](https://dust.tt), construit avec Electron.

![Platform](https://img.shields.io/badge/platform-macOS-lightgrey?logo=apple)
![Electron](https://img.shields.io/badge/Electron-29-47848F?logo=electron)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## ✨ Fonctionnalités

- 🖥️ **App native macOS** — fenêtre dédiée, traffic lights natifs
- 🔐 **SSO Microsoft** — authentification Single Sign-On compatible
- 🔔 **Tray icon** — accès rapide depuis la barre de menus
- ⌨️ **Raccourci global** — `⌘ + Shift + D` pour afficher/masquer
- 💾 **Session persistante** — rester connecté entre les sessions
- 🌗 **Splashscreen** — écran de chargement animé au démarrage
- 📐 **Mémoire de fenêtre** — taille et position sauvegardées
- 🔗 **Liens externes** — ouverts dans le navigateur système

---

## 📋 Prérequis

- macOS 12+
- [Node.js](https://nodejs.org) v18+ (inclut npm)

---

## 🚀 Installation (développement)

````bash
# Cloner le repo
git clone https://github.com/TON_USERNAME/dust-ai-desktop.git
cd dust-ai-desktop

# Installer les dépendances
npm install

# Lancer en mode dev
npm start

📦 Build
macOS (.dmg)
npm run build
Le fichier Dust AI-1.0.0.dmg sera généré dans le dossier dist/.
⚠️ Sans certificat Apple Developer, macOS affichera un avertissement à la première ouverture.

Contourne-le via Clic droit → Ouvrir.
🗂️ Structure du projet
dust-ai-desktop/
├── main.js          # Processus principal Electron
├── preload.js       # Script de préchargement sécurisé
├── splash.html      # Écran de chargement
├── package.json     # Configuration & build
└── assets/
    ├── icon.png     # Icône app (512x512)
    ├── icon.icns    # Icône macOS native
    └── tray-icon.png # Icône barre de menus (32x32)
⌨️ Raccourcis
Raccourci	Action
⌘ + Shift + D	Afficher / Masquer l'app
⌘ + R	Recharger la page
⌘ + Q	Quitter Dust AI
⌘ + + / ⌘ + -	Zoom avant / arrière