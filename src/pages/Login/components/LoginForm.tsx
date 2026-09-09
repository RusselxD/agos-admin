import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import PasswordField from "../../../components/common/auth/PasswordField";
import { normalizeNumberInput } from "../../../lib/utils/formatter";
import type { FormEvent } from "react";
import PhoneNumberInput from "../../../components/common/auth/PhoneNumberInput";

export default function LoginForm() {
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [normalizedPhoneNumber, setNormalizedPhoneNumber] =
        useState<string>("");

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleInputNumber = (input: string) => {
        normalizeNumberInput(input, setPhoneNumber, setNormalizedPhoneNumber);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");

        // Remove focus from any input fields
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        try {
            setIsLoading(true);
            await login(normalizedPhoneNumber, password);
            navigate("/dashboard");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.detail ||
                        error.message ||
                        "Login failed. Please try again.",
                );

                if (error.response?.status === 401) {
                    setPassword("");
                    setPhoneNumber("");
                    setNormalizedPhoneNumber("");
                }
            } else {
                setErrorMessage("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={(e) => handleSubmit(e)}
            className="w-full flex flex-col gap-10"
        >
            {errorMessage && (
                <div className="border border-red-500 dark:border-red-800 bg-red-100 dark:bg-red-900/20 -mb-5 px-3 py-2 rounded-md text-sm text-red-800 dark:text-red-400">
                    {errorMessage}
                </div>
            )}
            <PhoneNumberInput
                phoneNumber={phoneNumber}
                handleInputNumber={handleInputNumber}
                normalizedPhoneNumber={normalizedPhoneNumber}
            />
            <PasswordField
                label="PASSWORD"
                placeholder="Enter your password"
                password={password}
                setPassword={setPassword}
            />
            <button
                disabled={
                    normalizedPhoneNumber.length <= 12 || !password || isLoading
                }
                type="submit"
                className="bg-primary dark:bg-blue-600 flex items-center justify-center gap-5 rounded-xl hover:bg-primary/90 dark:hover:bg-blue-700 transition-colors py-3 px-8 text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary dark:disabled:hover:bg-blue-600"
            >
                {isLoading && <div className="spinner w-5 h-5"></div>}
                <span>LOGIN</span>
            </button>
        </form>
    );
}
