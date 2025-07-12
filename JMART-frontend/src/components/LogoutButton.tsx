import { useAuth } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const LogoutButton = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      Logout
    </Button>
  );
};

export default LogoutButton; 