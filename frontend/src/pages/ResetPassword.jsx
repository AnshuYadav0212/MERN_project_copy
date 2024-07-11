import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from 'react-icons/fa';
import '../styles/resetPassword.css';

const BACKEND_URL=process.env.REACT_APP_BACKEND_URL||'http://localhost:8080';

function ResetPassword() {

    const [formData, setFormData] = useState({
        email: '',
        roll: '',
        newPassword: '',
        confirmPassword: '',
        otp: '',
    });

    // below lines are for storing otp from 6 input boxes and adding it to formData.otp
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);
    const handleOtpChange = (e, index) => {
        const newOtp = [...otp];
        newOtp[index] = e.target.value;
        setOtp(newOtp);
        formData.otp = newOtp.join('');
        if (e.target.value !== '') {
            if (index < inputRefs.current.length - 1) {
                inputRefs.current[index + 1].focus();
            }
        }
    };

    const [otpSent, setOtpSent] = useState(false);

    const handleDataChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };
    const navigator = useNavigate();

    const sendOtpRequest = () => {
        if (formData.email === "" || formData.roll === "") {
            alert("Please enter all the fields");
        }
        else {
            const sendOtp = async () => {
                const response = await fetch(`${BACKEND_URL}/sendAuthCode`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        roll: formData.roll,
                    }),
                });
                if (!response.ok) {
                    return false;
                }
                return true;
            }

            const otpSent = sendOtp();
            if (otpSent) {
                setOtpSent(true);
            }
            else {
                alert('Failed to send OTP. Please try again.');
            }
        }
    }

    const handleReset = async () => {
        const resetPwd = async () => {
            const response = await fetch(`${BACKEND_URL}/student/resetPassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    roll: formData.roll,
                    newPass: formData.newPassword,
                    authCode: formData.otp,
                }),
            });
            if (!response.ok) {
                return false;
            }
            return true;
        };    
        if (formData.newPassword === "" || formData.confirmPassword === "") {
            alert("Please enter your new password and confirm it.");
        }
        else if(formData.newPassword !== formData.confirmPassword){
            alert("Passwords do not match");
        }
        else if(formData.newPassword.length < 6){
            alert("Password should be atleast 6 characters long");
        }   
        else {
            try {
                const pwdReset = await resetPwd(); // Wait for resetPwd() to complete
               
                if (pwdReset) {
                    console.log(formData.otp);
                    alert('Password reset successful');
                    navigator('/login?type=student');
                }
                else {
                    alert('Password reset failed. Please try again.');
                }
            } catch (error) {
                console.error("Error occurred during password reset:", error);
                alert('Password reset failed. Please try again.');
            }
        }
    }


    return (
        <div className="flex items-center justify-center h-screen p-10 max-w-xl mx-auto" style={{ backgroundImage: 'linear-gradient(to bottom, #b1dfdfef, hsl(0, 35%, 85%))' }}>
            <div className="form pl-12">
                <div className='ArrowContainer_washer' ><Link to={'/Login?type=student'}><FaArrowLeft className='arrow_washer' /></Link></div>

                <h1>Verify</h1>
                <div className="input-container">
                    <label>Username:</label>
                    <input
                        type="text"
                        placeholder="enter your email"
                        name="email"
                        value={formData.email}
                        onChange={handleDataChange} />
                </div>
                <div className="input-container">
                    <label>Roll No:</label>
                    <input
                        type="text"
                        placeholder="enter your roll no"
                        name="roll"
                        value={formData.roll}
                        onChange={handleDataChange} />
                </div>
                {!otpSent &&
                    <div className="button-container mt-6">
                        <button className="button-Type1" onClick={sendOtpRequest}>
                            Generate OTP
                        </button>
                    </div>
                }
                {otpSent && (
                    <div className="reset-pass-div">
                        <h1>Create Password</h1>
                        <div className="input-container">
                            <label>New Password:</label>
                            <input
                                type="password"
                                placeholder="Create a New password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleDataChange} />
                        </div>
                        <div className="input-container">
                            <label>Confirm Password:</label>
                            <input
                                type="password"
                                placeholder="Confirm New password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleDataChange} />
                        </div>
                        <label>Enter OTP: </label>
                            <div className=" flex items-center justify-center max-w-0 ml-3" >
                                
                                {otp.map((digit, index) => (
                                    <input className="p-6 m-4 flex items-center justify-center text-center"
                                    style={{width:'30px'}}
                                        key={index}
                                        type="text"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e, index)}
                                        maxLength={1}
                                        ref={(ref) => (inputRefs.current[index] = ref)}
                                    />
                                ))}
                            </div>
                        <div className="button-container">
                            {/* <button className='button-Type1' onClick={sendOtpRequest}>Resend OTP</button> */}
                            <button className="button-Type1" onClick={handleReset}>
                                Verify and reset Password
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
export default ResetPassword;

