# AEP Power Tools — Chrome Extension 🚀

**Adobe Experience Platform (AEP)** management, monitoring, and debugging — supercharged.

This Chrome Extension transforms the AEP UI into a powerhouse for Developers and Marketers, providing deep introspection, real-time metrics, and AI-driven insights directly within your browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

---

## 🌟 Key Features

### 1. **Advanced Dashboard & KPIs**
*   **Data Heartbeat**: Visualizing 24h ingestion patterns.
*   **Service Health Matrix**: Real-time status of critical AEP services (Catalog, UPS, Identity, etc.).
*   **AI Briefings**: Context-aware insights on system health and anomalies.

### 2. **Context-Aware Explorer (Side Panel)**
*   **Entity Browser**: Infinite scroll for Datasets, Schemas, Batches, and Segments.
*   **Smart Actions**: One-click Postman collection generation for any entity.
*   **Deep Linking**: Navigate complex relationships instantly.

### 3. **Developer Utilities (Pain Point Solvers)**
*   **SQL Anti-Pattern Linter**: Prevent query timeouts by detecting bad practices (e.g., missing time filters, `SELECT *`).
*   **Identity Graph Visualizer**: See the real Identity Service graph clusters to debug "Graph Collapse".
*   **Sync Gap Auditor**: Detect "Dirty" segments that have changed logic but haven't synced to destinations.
*   **Throughput Gauge**: Estimate streaming ingestion pressure.

### 4. **Global Command Palette** (`Ctrl+K`)
*   Fuzzy search across your entire AEP sandbox.
*   Jump to any dataset, schema, or segment instantly.

---

## 🛠️ Installation

### Locally (Developer Mode)
1.  Clone this repository:
    ```bash
    git clone https://github.com/shubhambhiwapurkar/aep-power-tools-ext.git
    cd aep-power-tools-ext
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the extension:
    ```bash
    npm run build
    ```
4.  Load into Chrome:
    *   Go to `chrome://extensions`
    *   Enable **Developer mode** (top right).
    *   Click **Load unpacked**.
    *   Select the `dist` folder.

### Usage
*   **Click the Extension Icon**: Opens the **Side Panel** (Explorer & Utilities).
*   **Ctrl+K (Cmd+K)**: Opens the **Command Palette**.
*   **Dashboard**: Accessed via Side Panel or Popup (if configured).

---

## 🏗️ Architecture

Built with a modern, performance-first stack:
*   **React 18** + **Vite** (Fast HMR & Building)
*   **TypeScript** (Type safety for AEP API models)
*   **TailwindCSS** + **Shadcn/UI** (Premium, accessible UI)
*   **Chrome Extension V3 Manifest** (Side Panel, Service Workers)

### Directory Structure
```
src/
├── components/      # UI Components (Shell, Explorer, Charts)
├── lib/             # Core Logic
│   ├── aep-client.ts   # Unified AEP API Client
│   ├── agent/          # AI Service Integration
│   └── utils.ts        # Helpers
├── pages/           # Route Pages (Dashboard, Ingestion, etc.)
└── background.ts    # Service Worker (Side Panel handling)
```

---

## 🤝 Contributing

We welcome contributions! Please fork the repo and submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
