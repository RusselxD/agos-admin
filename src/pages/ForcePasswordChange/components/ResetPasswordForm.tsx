import { useState } from "react";
import PasswordField from "../../../components/common/auth/PasswordField";
import SecurityChecklist from "./SecurityChecklist";
import type { ChangePasswordCredentials } from "../../../types/auth";
import { authAPI } from "../../../lib/api/auth";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const hasUpper = (str: string): boolean => {
    return /[A-Z]/.test(str);
};

const hasLower = (str: string): boolean => {
    return /[a-z]/.test(str);
};

const hasNumber = (str: string): boolean => {
    return /[0-9]/.test(str);
};

const hasSpecialChar = (str: string): boolean => {
    return /[!@#$%^&*(),.?"-:{}|<>]/.test(str);
};

const atLeats8Chars = (str: string): boolean => {
    return str.length >= 8;
};

export interface Checklist {
    atLeats8Chars: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    passwordsMatch: boolean;
}

export default function ResetPasswordForm() {
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { toastError, toastSuccess } = useToast();
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    const [checklist, setChecklist] = useState<Checklist>({
        atLeats8Chars: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        passwordsMatch: false,
    });

    const handlePassswordChange = (value: string) => {
        setChecklist((prev) => ({ ...prev, hasUppercase: hasUpper(value) }));

        setChecklist((prev) => ({ ...prev, hasLowercase: hasLower(value) }));

        setChecklist((prev) => ({ ...prev, hasNumber: hasNumber(value) }));

        setChecklist((prev) => ({
            ...prev,
            hasSpecialChar: hasSpecialChar(value),
        }));

        setChecklist((prev) => ({
            ...prev,
            atLeats8Chars: atLeats8Chars(value),
        }));

        setChecklist((prev) => ({
            ...prev,
            passwordsMatch:
                value === confirmPassword && confirmPassword.length > 0,
        }));

        setPassword(value);
    };

    const handleConfirmPasswordChange = (value: string) => {
        setChecklist((prev) => ({
            ...prev,
            passwordsMatch: value === password && value.length > 0,
        }));
        setConfirmPassword(value);
    };

    const isReadyToSubmit = Object.values(checklist).every(
        (value) => value === true
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            const newPassword = {
                new_password: password,
            } as ChangePasswordCredentials;

            // Call API to reset password and update context
            const res = await authAPI.resetPassword(newPassword);
            updateUser(res.access_token);

            toastSuccess("Password changed successfully.");
            navigate("/dashboard");
        } catch {
            toastError("Failed to change password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={(e) => handleSubmit(e)}
            className="w-full flex flex-col gap-6"
        >
            <PasswordField
                label="NEW PASSWORD"
                placeholder="Create password"
                password={password}
                setPassword={handlePassswordChange}
            />
            <PasswordField
                label="CONFIRM NEW PASSWORD"
                placeholder="Confirm password"
                password={confirmPassword}
                setPassword={handleConfirmPasswordChange}
            />
            <SecurityChecklist checklist={checklist} />
            <button
                disabled={!isReadyToSubmit || isLoading}
                type="submit"
                className="bg-primary flex items-center justify-center gap-5 rounded-xl hover:bg-primary/90 transition-colors py-3 px-8 text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
            >
                {isLoading && <div className="spinner w-5 h-5"></div>}
                <span>Change Password</span>
            </button>
        </form>
    );
}
