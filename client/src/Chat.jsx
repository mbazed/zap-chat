import { io } from "socket.io-client";
import { useState, useEffect } from "react";
import axios from "axios";

const fetchTokenAndConnect = async (setSocket) => {
  try {
    const response = await axios.get("http://localhost:5000/api/auth/token", {
      withCredentials: true,
    });
    const token = response.data.accessToken;

    const newSocket = io("http://localhost:5000", {
      auth: { token },
      withCredentials: true,
    });

    setSocket(newSocket);
  } catch (error) {
    console.error("Error fetching token:", error);
  }
};

const Chat = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchTokenAndConnect(setSocket);

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // const sendMessage
  return (
    <div className="flex h-screen">
      <div className="bg-gray-900 w-1/3">Contacts</div>
      <div className="flex flex-col bg-gray-700 w-2/3">
        <div className="flex-grow p-2">Messages</div>
        <div className="flex p-2 gap-2">
          <input
            type="text"
            placeholder="Your Message"
            className="flex-grow bg-gray-500 rounded-sm focus:outline-none focus:ring-1 p-2"
          />
          <button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
