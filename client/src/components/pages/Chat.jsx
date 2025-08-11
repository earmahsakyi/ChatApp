import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const Chat = () => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("send_message", message);
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">💬 Real-Time Chat</h1>

      <div className="w-full max-w-md bg-white p-4 rounded shadow">
        <div className="h-64 overflow-y-auto border border-gray-300 p-2 mb-4">
          {chat.map((msg, idx) => (
            <div key={idx} className="p-2 bg-gray-200 my-1 rounded">
              {msg}
            </div>
          ))}
        </div>

        <div className="flex">
          <input
            type="text"
            className="flex-1 border p-2 rounded-l"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-r"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;