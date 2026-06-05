<p align="center">
  <h1 align="center">💳 VaultPay — Frontend UI</h1>
  <p align="center">
    <strong>A modern, beautiful React dashboard for the VaultPay digital wallet platform</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Framer_Motion-12-0055FF?logo=framer&logoColor=white" alt="Framer Motion" />
    <img src="https://img.shields.io/badge/Axios-1.14-5A29E4?logo=axios&logoColor=white" alt="Axios" />
    <img src="https://img.shields.io/badge/Lucide_Icons-1.7-F56040" alt="Lucide" />
  </p>
</p>

---

## 📋 Overview

**VaultPay UI** is the client-side application for the VaultPay digital wallet platform. It provides a premium, responsive dashboard experience with dark/light mode, smooth animations, and a clean financial interface.

> **Backend Required**: This frontend communicates with the [VaultPay Backend](https://github.com/YOUR_USERNAME/vaultpay-backend) microservices via REST API.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏠 **Dashboard** | Financial snapshot with balance card, recent transactions, and quick actions |
| 💸 **Send Money** | Transfer funds to any registered user by phone number |
| 📊 **Transaction History** | Searchable, filterable ledger of all incoming/outgoing transactions |
| 👤 **Profile Management** | View account details, change password, manage preferences |
| 💰 **Add Money** | Top up wallet balance |
| 🧾 **Bill Payment** | Pay utility bills directly from your wallet |
| 🌗 **Dark/Light Mode** | Toggle between themes with smooth transitions |
| 🔔 **Real-time Notifications** | Bell icon with animated badge for transfer confirmations |
| 🎨 **Premium Animations** | Framer Motion page transitions, micro-interactions, and spring physics |

---

## 📸 Screenshots

### Login Page
> Secure authentication with email/password. JWT tokens are stored for session management.

### Dashboard
> Financial overview with balance card, quick send/receive actions, and recent transaction feed.

### Send Money
> Clean transfer interface — enter recipient's phone number and amount. Real-time validation with balance checks.

### Transaction History
> Full ledger with search, filter (Money In/Out), and formatted descriptions showing actual user names.

### Profile
> Account details, security settings (password change), and theme preferences.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **VaultPay Backend** running at `http://localhost:3000` (see [vaultpay-backend](https://github.com/YOUR_USERNAME/vaultpay-backend))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/vaultpay-ui.git
cd vaultpay-ui

# 2. Install dependencies
npm install

# 3. (Optional) Configure API URL
cp .env.example .env
# Edit .env to point to your backend if not using localhost

# 4. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000/api` | Backend API Gateway URL |

---

## 🏗️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 19** | UI component framework |
| **Vite 8** | Lightning-fast build tool & dev server |
| **React Router 7** | Client-side routing |
| **Axios** | HTTP client with interceptors for JWT |
| **Framer Motion** | Premium animations & page transitions |
| **Lucide React** | Beautiful, consistent icon set |
| **CSS Modules** | Scoped, maintainable styling |
| **Google Fonts (Inter)** | Modern, clean typography |

---

## 📁 Project Structure

```
vaultpay-ui/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/
│   │   └── client.js           # Axios instance with JWT interceptors
│   ├── components/
│   │   ├── AppLayout.jsx       # Main layout (Sidebar + Topbar + Content)
│   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   └── Topbar.jsx          # Theme toggle, notifications, profile
│   ├── context/
│   │   ├── AuthContext.jsx     # Authentication state management
│   │   └── ThemeContext.jsx    # Dark/Light mode state
│   ├── pages/
│   │   ├── LoginPage.jsx       # Authentication page
│   │   ├── DashboardPage.jsx   # Main dashboard
│   │   ├── TransferPage.jsx    # Send money
│   │   ├── HistoryPage.jsx     # Transaction history
│   │   ├── ProfilePage.jsx     # User profile & settings
│   │   ├── AddMoneyPage.jsx    # Wallet top-up
│   │   └── BillPaymentPage.jsx # Bill payments
│   ├── utils/
│   │   ├── formatCurrency.js   # Currency formatting helper
│   │   └── formatTx.js         # Transaction description formatter
│   ├── App.jsx                 # Route definitions
│   ├── main.jsx                # App entry point
│   └── index.css               # Global design system (themes, tokens)
├── index.html
├── vite.config.js
├── package.json
└── .env.example
```

---

## 🎨 Design System

The app uses a custom CSS design system with:
- **CSS Custom Properties** for theming (light/dark)
- **HSL color palette** for harmonious, vibrant colors
- **8px spacing scale** for consistent layouts
- **Inter font family** from Google Fonts
- **Glassmorphism effects** on cards and overlays
- **CSS Modules** for component-scoped styles

---

## 📄 License

This project is built as a portfolio demonstration of modern frontend engineering.

---

<p align="center">
  Built with ❤️ by <strong>Monish Reddy</strong>
</p>
