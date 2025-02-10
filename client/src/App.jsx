import React, { useContext } from "react";
import UserContextProvider, { UserContext } from "./UserContext";
import Register from "./Register";
import Routes from "./Routes";

function App() {
  const username = useContext(UserContext);
  console.log(username);
  return (
    <UserContextProvider>
      {/* <Register /> */}
      <Routes />
    </UserContextProvider>
  );
}

export default App;
