# 📦 Inventory Management System (IMS)

The **Inventory Management System (IMS)** is a full-stack web application designed to help businesses efficiently manage their **inventory, products, billing, and customer transactions**.

The system provides an easy-to-use interface for:

- Tracking stock levels
- Searching products
- Generating receipts
- Managing inventory operations

This project follows a **Client–Server Architecture**, where:

- **Frontend (Client)** handles the user interface and user interactions.
- **Backend (Server)** manages business logic, APIs, and database operations.

The application helps improve inventory control by allowing users to **maintain product records, monitor stock availability, and generate transaction receipts automatically.**

---

# 🚀 Project Overview

The system includes several important features that make inventory management easier and more efficient.

### Key Features

- 📦 **Product Inventory Management**  
  Add, update, and manage product details within the system.

- 🔍 **Product Search Functionality**  
  Quickly search for products using the integrated search feature.

- 📊 **Stock Tracking and Updates**  
  Monitor stock levels and update product quantities when needed.

- 🔔 **Notification System**  
  Receive alerts and notifications related to inventory activities.

- 🧾 **Receipt Generation**  
  Automatically generate receipts for transactions and billing.

- 🖥 **User-Friendly Dashboard**  
  A clean interface that makes it easy to manage inventory operations.

- 🔗 **Backend API Integration**  
  Seamless communication between the frontend and backend using APIs.

---

# 🏗 System Architecture

The project is divided into two main components:

### 1️⃣ Client (Frontend)
Responsible for handling the **user interface and user interactions**.

Functions include:

- Displaying product data
- Handling user inputs
- Sending requests to backend APIs
- Showing notifications and receipts

### 2️⃣ Server (Backend)
Responsible for **application logic and data management**.

Functions include:

- Processing API requests
- Managing inventory data
- Handling database operations
- Generating receipts and transaction records

## 📁 Repository File Structure

Due to GitHub's file upload size limitation (25MB), the project is uploaded as two compressed files:

- **client.zip** → Contains the frontend source code  
- **server.zip** → Contains the backend source code  

After extracting both files, the project structure will look like this:

```
IMS-Project
│
├── client
│   │
│   ├── public
│   │   └── Static files and assets
│   │
│   ├── src
│   │   │
│   │   ├── components
│   │   │   └── Reusable UI components
│   │   │
│   │   ├── pages
│   │   │   └── Different application pages
│   │   │
│   │   ├── services
│   │   │   └── API communication functions
│   │   │
│   │   ├── styles
│   │   │   └── CSS and styling files
│   │   │
│   │   ├── App.js
│   │   │   └── Main application component
│   │   │
│   │   └── main.js / index.js
│   │       └── Application entry point
│   │
│   ├── package.json
│   │   └── Project dependencies and scripts
│   │
│   └── vite.config.js
│       └── Vite configuration file
│
├── server
│   │
│   ├── routes
│   │   └── API route definitions
│   │
│   ├── controllers
│   │   └── Business logic for handling requests
│   │
│   ├── models
│   │   └── Database schemas or data models
│   │
│   ├── config
│   │   └── Database and environment configuration
│   │
│   ├── middleware
│   │   └── Request handling middleware
│   │
│   ├── server.js / app.js
│   │   └── Main backend server file
│   │
│   └── package.json
│       └── Backend dependencies
│
└── README.md
    └── Project documentation
```
