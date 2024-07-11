import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BACKEND_URL=process.env.REACT_APP_BACKEND_URL||'http://localhost:8000';

const Below = ({ counter }) => {
    const [total, setTotal] = useState(0);
    const [Ctotal, setCtotal] = useState(0);

    useEffect(() => {
        calculateTotal();
    }, [counter]);

    const calculateTotal = () => {
        let x = counter['1'] * 10 + counter['2'] * 10 + counter['3'] * 10 + counter['4'] * 10 + counter['5'] * 10;
        let y = counter['1'] + counter['2'] + counter['3'] + counter['4'] + counter['5'];
        setTotal(x);
        setCtotal(y);
    };

    const navigate = useNavigate();

    const handleWashCLothes = async () => {
        let clothes =[
            {'type':'upper wear','quantity':counter['1']},
            {'type':'lower wear','quantity':counter['2']},
            {'type':'socks','quantity':counter['3']},
            {'type':'heavy wear','quantity':counter['4']},
            {'type':'miscellaneous','quantity':counter['5']}
        ];
        
        console.log("Washing Clothes");

        try {
            const response = await fetch(`${BACKEND_URL}/student/requestWash`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    "clothes": clothes
                })
            });

            if (response.ok) {
                toast.success("Wash Request made.", {
                    position: "top-center",
                    autoClose: 2000,
                  });
            } else if (response.status === 400) {
                const data = await response.json();
                alert(data.message); // Request already accepted
            } else if (response.status === 500) {
                toast.success("Internal Server Error", {
                    position: "top-center",
                    autoClose: 2000,
                  });
            } else {
                toast.success("Error making Wash request", {
                    position: "top-center",
                    autoClose: 2000,
                  });
            }

            navigate("/StudentDashboard");
        } catch (error) {
            console.error('Error making wash request:', error);
            // alert('Error making wash request');
        }
    };

    return (
        <>
            <div className="flex">
                <ToastContainer/>
                <div className="text-2xl font-bold text-blue-500">
                    Total Clothes:
                </div>
                <div className="flex-auto text-2xl font-bold text-blue-500 text-right">
                    {Ctotal}
                </div>
            </div>

            <div className="flex">
                <div className="text-2xl font-bold text-blue-500">
                    Total Cost:
                </div>
                <div className="flex-auto text-2xl font-bold text-blue-500 text-right">
                    {total}
                </div>
            </div>

            <div className="flex">
                <div className="text-2xl font-bold text-blue-500">
                    Return date:
                </div>
                <div className="flex-auto text-2xl font-bold text-blue-500 text-right">
                   Unavailable 
                </div>
            </div>

            <Button 
                variant='contained' 
                className="max-w-screen flex flex-col items-center justify-center p- bg-blue-500 text-white px-4 py-2 mt-4 rounded-full focus:outline-none focus:ring focus:border-blue-300"
                onClick={handleWashCLothes}
            >
                WASH
            </Button>
        </>
    );
};

export default Below;

