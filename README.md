# SplitPro — Smart Expense Splitter

> A full-stack AI-powered expense splitting application built for the NeevAI internship assignment.

![SplitPro Banner](https://img.shields.io/badge/SplitPro-Smart%20Expense%20Splitter-7c6aff?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20PostgreSQL-blue?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Gemini%20%2F%20LLM%20Integration-8b5cf6?style=for-the-badge)

---

## 🚀 Overview

SplitPro is a modern expense-splitting platform that helps groups track shared expenses, calculate balances, and settle debts efficiently.

It enhances traditional expense tracking with **AI-powered categorization and insights**, along with a **greedy debt simplification algorithm** to minimize transactions.

---

## ✨ Features

### 💰 Core Features
- Create groups with custom icons
- Add/remove members via email
- Add expenses with flexible split options:
  - Equal split
  - Custom per-person split
- Real-time balance calculation
- One-click **“Settle Up”** with minimal transactions
- Clean, modern dark UI

---

### 🤖 AI Features
- ✨ **Auto Categorization**  
  Automatically categorizes expenses based on description

- 📊 **Spending Insights**  
  AI analyzes group expenses and generates actionable insights

- 📈 **Visual Analytics**  
  - Category-wise pie chart  
  - Member-wise spending bar chart  

---

## 🧠 Key Algorithms

### Debt Simplification (Greedy Algorithm)
- Converts complex debts into minimal transactions
- Matches highest creditor with highest debtor
- Reduces number of payments required

---

## 🛠 Tech Stack

| Layer     | Technology |
|----------|-----------|
| Frontend | React 18, Vite, React Router |
| Backend  | Node.js, Express |
| Database | PostgreSQL |
| AI       | Gemini / Groq (LLM APIs) |
| Auth     | JWT + bcrypt |
| Charts   | Recharts |

---

## 📂 Project Structure
