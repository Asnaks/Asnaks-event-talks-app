# BigQuery Release Notes Hub

An interactive, responsive dashboard for exploring Google Cloud BigQuery release notes. The application is built using a Python Flask backend and a modern vanilla HTML/CSS/JavaScript frontend. It extracts grouped release updates (Features, Issues, Deprecations) and allows users to draft and share custom tweets about individual updates directly on X (formerly Twitter).

---

## 🌟 Key Features

*   **Live XML Feed Sync**: Directly fetches and displays the live feed from the [official BigQuery Release Notes](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml).
*   **Granular Update Splitting**: Automatically splits aggregated daily release notes into distinct, digestible cards by category (Features, Issues, Deprecations, and more).
*   **Instant Search & Tag Filtering**: Instantly search across all notes or filter cards by specific categories.
*   **Tweet Intent Composer**: Hover over any release card to reveal a X/Twitter button, allowing you to compose and post a formatted tweet directly from the app.
*   **Premium Visuals**: Dark-themed UI with glassmorphic cards, smooth animations, and tailored CSS variables.

---

## 🏛️ Project Structure

```
├── app.py               # Flask Web Server & XML Parser
├── static/
│   ├── app.js           # Client-side API caller & HTML rendering logic
│   └── style.css        # Custom CSS variables, themes, & animations
├── templates/
│   └── index.html       # Client Dashboard HTML Template
├── .gitignore           # Python/Flask development ignore patterns
└── README.md            # Project documentation
```

---

## 🛠️ Quick Start

### 1. Prerequisites
Ensure you have Python 3.8+ installed.

### 2. Installation
Clone the repository and install the dependencies:
```bash
pip install flask
```

### 3. Running the Application
Start the Flask development server:
```bash
python app.py
```

Open your browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## ⚙️ How It Works

1.  **Backend Fetching**: The Flask backend proxy fetches the Google Cloud XML feed, parses the Atom entries using the `xml.etree.ElementTree` parser, and exposes it as a clean JSON API endpoint `/api/releases`.
2.  **Frontend Parsing**: In the client, the JavaScript engine parses each day's entries and isolates headings (`<h3>`) to split single daily bulk releases into individual cards.
3.  **Sharing**: The Tweet composer prepares a formatted tweet layout (truncated automatically to fit within the 280-character limit with custom hashtags) and opens the X Web Intent handler.
