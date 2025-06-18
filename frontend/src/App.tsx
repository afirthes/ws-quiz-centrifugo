import { useState } from "react";
import { signup, signin, signout } from "./auth";

type Mode = "login" | "signup";

function App() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>("login");

  const handleLogin = async () => {
    const success = await signin(email, password);
    if (success) setLoggedIn(true);
    else alert("Login failed");
  };

  const handleSignup = async () => {
    const success = await signup(email, password, passwordConfirm);
    if (success) {
      alert("Registered!");
      setMode("login");
    } else alert("Signup failed");
  };

  const handleLogout = async () => {
    const success = await signout();
    if (success) setLoggedIn(false);
  };

  return (
      <div style={{ maxWidth: "400px", margin: "2rem auto" }}>
        <h1>{loggedIn ? "Welcome!" : mode === "login" ? "Login" : "Signup"}</h1>

        {!loggedIn ? (
            <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (mode === "login") {
                    handleLogin();
                  } else {
                    handleSignup();
                  }
                }}
            >
              <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
              /><br/>
              <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
              /><br/>
              {mode === "signup" && (
                  <input
                      type="password"
                      placeholder="Confirm Password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      required
                  />
              )}<br/>
              <button type="submit">{mode === "login" ? "Login" : "Signup"}</button>
              <p>
                {mode === "login" ? (
                    <>
                      Don't have an account?{" "}
                      <button type="button" onClick={() => setMode("signup")}>Signup</button>
                    </>
                ) : (
                    <>
                      Already have an account?{" "}
                      <button type="button" onClick={() => setMode("login")}>Login</button>
                    </>
                )}
              </p>
            </form>
        ) : (
            <button onClick={handleLogout}>Logout</button>
        )}
      </div>
  );
}

export default App;