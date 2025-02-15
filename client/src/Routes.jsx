import { useContext } from "react";
import { UserContext } from "./UserContext";
import Register from "./Register";
import Chat from "./Chat";

const Routes = () => {
  const { username, id } = useContext(UserContext);

  if (username) {
    return <Chat />;
  }

  return <Register />;
};

export default Routes;
