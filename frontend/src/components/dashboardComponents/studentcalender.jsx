import React, { useState, useEffect } from "react";
import axios from 'axios';
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import "./calendarApp.css";
import './footerwashdash.css';

const BACKEND_URL=process.env.REACT_APP_BACKEND_URL||"http://localhost:8080";

const StudentCalendar = () => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [highlightedDates, setHighlightedDates] = useState([]);
    const [clothesMap, setClothesMap] = useState({});
    const [openDialog, setOpenDialog] = useState(false);
    const [clothesForDate, setClothesForDate] = useState([]);
    const [dueAmount, setDueAmount] = useState(0);
    const [student, setStudent] = useState({ name: '', phone: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchStudentInfo();
        fetchData();
        fetchDueAmount();
    }, []);

    const fetchStudentInfo = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/student/fetchNameandDueAmount`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                console.log("Student Info:", data);
                setStudent(data);
            } else {
                console.error("Failed to fetch student info");
            }
        } catch (error) {
            console.error("Error fetching student info:", error);
        }
    };

    const fetchData = async () => {
        try {
            const datesResponse = await fetch(`${BACKEND_URL}/student/fetchDates`, {
                method: 'GET',
                credentials: 'include'
            });
            if (datesResponse.ok) {
                const datesJson = await datesResponse.json();
                setHighlightedDates(datesJson.dates);

                const clothesData = await Promise.all(datesJson.dates.map(async date => {
                    const clothesResponse = await fetch(`${BACKEND_URL}/student/fetchRecord`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            date: date,
                        })
                    });
                    if (clothesResponse.ok) {
                        const clothesJson = await clothesResponse.json();
                        return { date: date, clothes: clothesJson.clothes };
                    } else {
                        console.error("Failed to fetch clothes for date", date);
                        return { date: date, clothes: [] };
                    }
                }));

                const clothesMap = {};
                clothesData.forEach(({ date, clothes }) => {
                    clothesMap[date] = clothes;
                });
                setClothesMap(clothesMap);
            } else {
                console.error("Failed to fetch dates");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchDueAmount = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/student/fetchDueAmount`, {
                method: 'GET',
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                console.log("Due Amount:", data);
                setDueAmount(data.dueAmount);
            } else {
                console.error("Failed to fetch due amount");
            }
        } catch (error) {
            console.error("Error fetching due amount:", error);
        }
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        setClothesForDate(clothesMap[date.toDateString()] || []);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleWashClothes = () => {
        navigate("/WashClothes");
    };

    const handlePayDues = async () => {
        const paymentMethod = prompt("Enter payment method (cash or online):");
    
        if (paymentMethod !== null) {
            const paymentMethodLower = paymentMethod.toLowerCase();
            let phone = null;
    
            if (paymentMethodLower === "online") {
                phone = prompt("Enter your phone number for payment:");
            }
    
            try {
                if (paymentMethodLower === "online" && phone !== null) {
                    const data = {
                        name: student.name,
                        amount: dueAmount,
                        number: phone,
                        MUID: 'MUID' + Date.now(),
                        transactionID: 'TRID' + Date.now()
                    };
                    console.log("Data to be sent for online payment:", data);
    
                    const response = await axios.post(`${BACKEND_URL}/order`, data);
                    if (response.data.success) {
                        window.location.href = response.data.data.instrumentResponse.redirectInfo.url;
                    } else {
                        console.error("Online payment failed:", response.data.message);
                    }
    
                } else if (paymentMethodLower === "cash") {
                    const cashDueAmount = prompt("Enter the due amount:");
                    if (cashDueAmount !== null) {
                        const response = await fetch(`${BACKEND_URL}/student/requestCash`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ dueAmountcash: cashDueAmount }),
                        });
    
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const data = await response.json();
                            console.log("Response from requestCash API:", data);
    
                            if (response.ok && data.success) {
                                alert("Payment request sent to washerman for cash payment.");
                            } else {
                                console.error("Failed to send cash payment request:", data.message);
                            }
                        } else {
                            const text = await response.text();
                            console.error("Unexpected response format:", text);
                        }
                    }
                } else {
                    console.error("Invalid payment method");
                }
            } catch (error) {
                console.error("Error initiating payment:", error);
            }
        } else {
            console.log("Prompt was cancelled");
        }
    };

    return (
        <div>
            <div className="calendar-container">
                <Calendar
                    className="calender"
                    value={selectedDate}
                    onClickDay={handleDateClick}
                    tileClassName={({ date, view }) => {
                        const dateString = date.toDateString();
                        if (!highlightedDates.includes(dateString)) {
                            return "";
                        }
                        if (clothesMap[dateString] && clothesMap[dateString][0] && clothesMap[dateString][0].accept) {
                            return "green-tile";
                        } else {
                            return "red-tile";
                        }
                    }}
                />
            </div>
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Clothes for {selectedDate && selectedDate.toDateString()}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {clothesForDate.length > 0 ? (
                            <ul>
                                {clothesForDate[0].clothes.map((cloth, index) => (
                                    <li key={index}>
                                        <b>Type</b>: {cloth.type}, <b>Quantity</b>: {cloth.quantity}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No clothes recorded for this date</p>
                        )}
                    </DialogContentText>
                </DialogContent>
            </Dialog>
            <div className='flex pt-3'>
                <Button variant='contained' className='print-button' onClick={handlePayDues}>
                    Pay dues
                </Button>
                <Button variant='contained' className='cloths-button' onClick={handleWashClothes}>
                    Wash Clothes
                </Button>
            </div>
        </div>
    );
};

export default StudentCalendar;
