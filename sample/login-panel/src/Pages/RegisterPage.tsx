// RegisterPage.tsx
import React, { useState } from "react";
import { useHistory } from "react-router";
import { RegisterUserMessage } from "Plugins/UserService/APIs/RegisterUserMessage";
import { loginPagePath } from "./LoginPage";

export const registerPagePath = "/register";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [idNumber, setIdNumber] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [message, setMessage] = useState("");
    const history = useHistory();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            new RegisterUserMessage(idNumber, phoneNumber,username, password).send(
                () => {
                    history.push(loginPagePath);
                },
                (err: any) => {
                    setMessage(err.message || "注册失败");
                }
            );
        } catch (err: any) {
            setMessage(err.message || "注册失败");
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 border rounded-2xl shadow">
            <h2 className="text-2xl font-bold mb-4">注册</h2>
            <form onSubmit={handleRegister} className="space-y-4">
                <input
                    type="text"
                    placeholder="用户名"
                    className="w-full px-4 py-2 border rounded"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="密码"
                    className="w-full px-4 py-2 border rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="身份证号"
                    className="w-full px-4 py-2 border rounded"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="手机号"
                    className="w-full px-4 py-2 border rounded"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                />
                {message && <div className="text-red-500 text-sm">{message}</div>}
                <button
                    type="submit"
                    className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                >
                    注册
                </button>
            </form>
            <div className="mt-4 text-center">
                <span className="text-sm text-gray-600">已有账号？</span>
                <button
                    onClick={() => history.push(loginPagePath)}
                    className="ml-2 text-sm text-blue-600 hover:underline"
                >
                    去登录
                </button>
            </div>
        </div>
    );
}
