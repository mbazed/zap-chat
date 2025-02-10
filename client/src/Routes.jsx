import { useContext } from "react";
import { UserContext } from "./UserContext";
import Register from "./Register";

const Routes = () => {
  const { username, id } = useContext(UserContext);

  if (username) {
    return "Logged In";
  }

  return <Register />;
};

export default Routes;
