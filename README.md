# SwiftChat 💬

A **real-time chat application** built with the **MERN Stack** and **Socket.IO** for instant messaging.  
Users can send and receive messages instantly, see typing indicators, read receipts, and online/offline status — all in a clean, responsive UI.

---

## 🚀 Features

- **Instant Messaging** — Messages appear in real-time with Socket.IO.
- **User Authentication** — Secure login & signup with JWT.
- **Typing Indicators** — See when the other user is typing.
- **Read Receipts** — Know when your message has been seen.
- **Online/Offline Status** — Real-time user presence tracking.
- **Responsive Design** — Works across desktop, tablet, and mobile.
- **MongoDB Storage** — Chats are saved securely for history.

---

## 🖼 Screenshots


- **Landing Page**
<img width="1920" height="975" alt="land" src="https://github.com/user-attachments/assets/fee96adf-0c32-4edd-92e3-b13175800bfb" />

  
- **Sign Up / Login**
- <img width="1920" height="917" alt="RegisterC" src="https://github.com/user-attachments/assets/bcb09ad8-7fdf-44ee-af71-7a9c941b44ee" />
<img width="1920" height="1023" alt="Logincc" src="https://github.com/user-attachments/assets/d687384e-ab4c-4d4b-a700-0398c0eb2f57" />


- **Chat Dashboard**
- **Typing Indicator + Read Receipts Demo**
- <img width="1920" height="1026" alt="chats" src="https://github.com/user-attachments/assets/0f078220-9e5b-40ab-8f7f-4ef92c10670b" />

## 🛠 Tech Stack

**Frontend**
- React
- Redux
- Tailwind CSS
- React Router

**Backend**
- Node.js
- Express
- MongoDB (Mongoose)
- JWT Authentication
- Socket.IO

**Other Tools**
- Vite (Frontend build tool)
- Nodemon & Concurrently (Dev workflow)

## 📦 Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ChatApp.git
The server is in the  root the directory of the ChatApp
Install backend dependencie
npm install

Install client dependencies
cd client
npm install

Create a default.json in config folder file in server side
"MONGO_URI":"your_mongodb_uri"
"JWT_SECRET":"your_jwt_secret"
"RESEND_API_KEY": "your_resend_api_key"

Run the development servers
# Run both frontend & backend
npm run dev

📬 Contact
Emmanuel Armah Sakyi
Full Stack Developer — MERN | AWS Serverless | Machine Learning
https://www.linkedin.com/in/emmanuel-armah-sakyi-10b316312/  |  https://earmahsakyi.site/
