import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthFormContainer from "../../components/common/auth/AuthFormContainer";
import { useAuth } from "../../context/AuthContext";
import LoginForm from "./components/LoginForm";

export default function Login() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard");
        }
    }, [isAuthenticated, navigate]);

    return (
        <AuthFormContainer
            title="LOGIN"
            subtitle="PLEASE LOGIN TO YOUR ACCOUNT TO CONTINUE"
        >
            <LoginForm />
        </AuthFormContainer>
    );
}
