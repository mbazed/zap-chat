import { createContext, useState } from "react";

const UserContext = createContext({});

const UserContextProvider = ({ children }) => {
  const [username, setUsername] = useState(null);
  const [id, setId] = useState(null);
  return (
    <UserContext.Provider value={{ username, setUsername, id, setId }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;
export { UserContext };