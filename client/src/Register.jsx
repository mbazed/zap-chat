import React, { useContext, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import GoogleIcon from "./assets/google-round.svg";
import Logo from "./assets/logo-2.png";
import axios from "axios";
import { UserContext } from "./UserContext";

const API_BASE_URL = "http://localhost:5000/api/auth";

const Register = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (isLogin ? !email || !password : !email || !username || !password) {
      setError(
        isLogin ? "Both fields are required" : "All fields are required"
      );
      setTimeout(() => setError(""), 3000);
      return;
    } else {
      try {
        setIsLoading(!isLoading);

        const endpoint = isLogin ? "/login" : "/register";
        const payload = isLogin
          ? { email, password, rememberMe }
          : { username, email, password };
        const response = await axios.post(
          `${API_BASE_URL}${endpoint}`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
        console.log(response.data);
        setLoggedInUsername(response.data.user.username);
        setId(response.data.user.id);
      } catch (error) {
        if (error.response) {
          console.log(error);
          setError(
            error.response.data.message || "Login failed. Please try again."
          );
          setTimeout(() => setError(""), 3000);
        } else if (error.request) {
          console.log(error);
          setError("No response from server. Please try again.");
          setTimeout(() => setError(""), 3000);
        } else {
          console.log(error);
          setError("An error occured. Please try again after some time.");
          setTimeout(() => setError(""), 3000);
        }
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setEmail("");
    setUsername("");
    setPassword("");
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-2xl">
          <div className="text-center mb-3">
            <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center">
              {/* <div className="w-8 h-4 border-2 border-white rounded-full"></div> */}
              <div className="mx-auto mt-2 h-16 w-16 rounded-full flex items-center justify-center">
                <img src={Logo} className="" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-semibold">Welcome Back</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please enter your details to sign in
            </p>
          </div>

          <div className="flex items-center justify-center mb-3">
            <button className="flex justify-center items-center px-4 py-2 rounded-md cursor-pointer">
              <img src={GoogleIcon} alt="Google" className="h-8 w-8" />
            </button>
          </div>

          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <form className="mt-1 space-y-3 mb-3" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1"
                  placeholder="Enter your e-mail or username"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {isLogin ? "E-mail or Username" : "E-mail"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1"
                placeholder="Enter your e-mail or username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="h-1 flex items-center justify-center">
              <p className="text-red-500 text-sm transition-opacity duration-300">
                {error}
              </p>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="h-4 w-4 text-black border-gray-300 rounded accent-gray-900"
                  />
                  <label className="ml-2 text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
                <div>
                  <a href="#" className="text-sm text-gray-900 hover:underline">
                    Forgot Password?
                  </a>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 px-4 bg-gray-900 text-white rounded-md hover:bg-gray-700 cursor-pointer"
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <p className="mt-2 text-center text-sm text-gray-700">
            {isLogin
              ? "Don't have an account yet? "
              : "Already have an account? "}

            <button
              onClick={toggleMode}
              className="text-gray-900 font-bold hover:underline cursor-pointer"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
