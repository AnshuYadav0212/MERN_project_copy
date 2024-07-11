import React, { useState } from "react";
import "../styles/Login.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from 'react-icons/fa';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const BACKEND_URL=process.env.REACT_APP_BACKEND_URL||'http://localhost:8000';
function Login() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const userType = searchParams.get("type");

    const navigator = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const verifyUser = async () => {
        let body;
        let url;
        if (userType === 'student') {
            body = { roll: username, pass: password };
            url =  `${BACKEND_URL}/session/student/login`;
        } else if (userType === 'washerman') {
            body = { contact: username, pass: password };
            url = `${BACKEND_URL}/session/washerman/login`;
        } else if (userType === 'admin') {
            body = { username, password };
            url = `${BACKEND_URL}/session/admin/login`;
        }
    
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(body)
        });
    
        if (response.ok) {
            return true;
        }
        return false;
    };
    

    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    }

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    }

    const handleLogin = async() => {
        if (username === "" || password === "") {
            showToast("Please enter all the fields", "error");
        }
        else{
            const isValidUser = await verifyUser();
            if (isValidUser) {
                showToast("Logged in", "success");
                if(userType === "student"){
                    navigator('/StudentDashboard');
                } else {
                    navigator('/WashermanSelection');
                }
            }
            else{
                showToast("Invalid Credentials", "error");
            }
        }
    }

    const showToast = (message, type) => {
        if (type === "success") {
            toast.success(message, {
                position: "top-center",
                autoClose: 2000,
            });
        } else {
            toast.error(message, {
                position: "top-center",
                autoClose: 2000,
            });
        }
    }

    return (
        <div className="flex items-center justify-center h-screen p-10 max-w-xl mx-auto" style={{ backgroundImage: 'linear-gradient(to bottom, #b1dfdfef, hsl(0, 35%, 85%))' }}>
            <ToastContainer/>
            <div className="form">
                <div className='ArrowContainer_washer' ><Link to="/"><FaArrowLeft className='arrow_washer' /></Link></div>
                <h1>Login</h1>
                {userType === "student" ?
                    <div className="input-container">
                        <label > Roll No:</label>
                        <input type="text" placeholder="Roll no" onChange={handleUsernameChange} />
                    </div>
                    :
                    <div className="input-container">
                        <label>Mobile no.:</label>
                        <input type="text" placeholder="mobile no." onChange={handleUsernameChange} />
                    </div>
                }

                <div className="input-container">
                    <label>Password:</label>
                    <input type="password" placeholder="password" onChange={handlePasswordChange} />
                </div>
                <div className="button-container p-3">
                        <button className="button-Type1" onClick={handleLogin}>Login</button>
                </div>
                {userType === "student" &&
                    <div className="form-footer ">
                        <p className="text-xs"> Forgot Password?
                            <Link to="/resetPassword" className="text-blue-800"> Create New Password</Link>
                        </p>
                        <p className="text-xs">Don't have an account?
                            <Link to="/RegisterStudent" className="text-blue-800"> Register Here</Link>
                        </p>
                    </div>
                }
            </div>
        </div>
    )
}

export default Login;
