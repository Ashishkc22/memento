# 🧠 Memento

**Memento** is a simple and extensible web-based memo management application built using Node.js and Express. It allows users to upload images and notes, tag them for easy retrieval, and manage them via a clean RESTful API.

---

## 🚀 Features

- 📁 Upload and organize memos (text and image-based)
- 🏷️ Tag support for categorizing memos
- 🧩 Modular codebase using Express MVC pattern
- 🗃️ MongoDB integration (or pluggable DB support)
- 🛡️ Authentication with JWT
- 🧪 Includes test scripts for core functionality

---

## 📦 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT-based authentication
- **File Uploads:** Multer middleware

---

## 📂 Folder Structure

```
memento
├── src
│   ├── controllers/     # Business logic
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── utils/           # Helper functions
│   └── middleware/      # Auth and error handling
├── uploads/             # Uploaded image files
├── tests/               # Unit and integration tests
├── DB.js                # Database connection setup
├── .env                 # Environment variables
├── index.js             # App entry point
└── package.json
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js ≥ 14.x
- MongoDB instance (local or remote)

### Installation

```bash
git clone https://github.com/Ashishkc22/memento.git
cd memento
npm install
