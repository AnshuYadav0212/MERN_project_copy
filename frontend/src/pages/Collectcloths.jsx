import React, { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import '../styles/Collectcloths.css';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BACKEND_URL=process.env.REACT_APP_BACKEND_URL||'http://localhost:8080';

const Collectcloths = () => {
    const [records, setRecords] = useState([]);
    const [cashPayments, setCashPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const hall = Cookies.get('selectedHall');
    const wing = Cookies.get('selectedWing');
    const navigate = useNavigate();

    const fetchRecords = useCallback(async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/washerman/wing/collectCloths`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: "include",
                body: JSON.stringify({ hall, wing })
            });

            if (!response.ok) {
                toast.error("Failed to fetch record", {
                    position: "top-center",
                    autoClose: 2000,
                });
                return;
            }

            const data = await response.json();
            console.log("Records fetched:", data.records);  // Debug log
            setRecords(data.records);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [hall, wing]);
    const fetchPendingCashRequests = useCallback(async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/washerman/pendingCashRequests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ hall, wing }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to fetch pending cash requests');
            }
    
            const data = await response.json();
            console.log("Cash Payments fetched:", data.students);  // Debug log
            setCashPayments(data.students || []);
        } catch (error) {
            console.error('Error fetching pending cash requests:', error);
            toast.error('Failed to fetch pending cash requests', {
                position: 'top-center',
                autoClose: 2000,
            });
            setCashPayments([]); // Ensure cashPayments is set to an empty array on error
        }
    }, [hall, wing]);
    
    

    useEffect(() => {
        fetchRecords();
        fetchPendingCashRequests();
        const interval = setInterval(() => {
            fetchRecords();
            fetchPendingCashRequests();
        }, 30000); // Fetch data every 30 seconds

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [fetchRecords, fetchPendingCashRequests]);

    const acceptRecord = async (studentIndex, recordIndex, roll) => {
        try {
            const response = await fetch(`${BACKEND_URL}/washerman/wing/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: "include",
                body: JSON.stringify({ hall, wing, roll })
            });

            if (!response.ok) {
                throw new Error('Failed to accept record');
            }

            const updatedRecords = [...records];
            updatedRecords[studentIndex].records[recordIndex].accept = true;
            setRecords(updatedRecords);
            toast.success("Clothes have been accepted", {
                position: "top-center",
                autoClose: 2000,
            });
            fetchRecords();
        } catch (error) {
            console.error('Error accepting record:', error);
        }
    };

    const acceptCashPayment = async (studentIndex, cashIndex, roll) => {
        try {
            const response = await fetch(`${BACKEND_URL}/washerman/acceptCashPayment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ hall, wing, roll }),
            });

            if (!response.ok) {
                throw new Error('Failed to accept cash payment');
            }

            const updatedCashPayments = [...cashPayments];
            updatedCashPayments[studentIndex].cashRequests[cashIndex].accept = true;
            setCashPayments(updatedCashPayments);
            toast.success('Cash payment accepted', {
                position: 'top-center',
                autoClose: 2000,
            });

            fetchPendingCashRequests(); // Refresh the pending cash requests after accepting payment
        } catch (error) {
            console.error('Error accepting cash payment:', error);
            toast.error('Failed to accept cash payment', {
                position: 'top-center',
                autoClose: 2000,
            });
        }
    };

    const backButton = () => {
        navigate("/WashermanDashboard");
    };

    if (loading) {
        return <div className="cloth-collection loading">Loading...</div>;
    }

    if (error) {
        return <div className="cloth-collection error">Error: {error}</div>;
    }

    return (
        <div className="cloth-collection">
            <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={backButton} style={{ marginLeft: '0px', important: true }}>
                BACK
            </Button>
            <ToastContainer />
            <h2><b>Collect Clothes Records</b></h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Roll</th>
                        <th>Wing</th>
                        <th>Hall</th>
                        <th>Records</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((student, studentIndex) => (
                        <tr key={studentIndex}>
                            <td>{student.name}</td>
                            <td>{student.roll}</td>
                            <td>{student.wing}</td>
                            <td>{student.hall}</td>
                            <td>
                                <ul>
                                    {student.records.map((record, recordIndex) => (
                                        <li key={recordIndex}>
                                            Date: {(new Date(record.date)).toDateString()}<br />
                                            Clothes: {record.clothes.map((cloth, clothIndex) => (
                                                <span key={clothIndex}>{cloth.type} ({cloth.quantity}){clothIndex !== record.clothes.length - 1 ? ', ' : ''}</span>
                                            ))}
                                            <br />
                                            Accepted: {record.accept.toString()}<br />
                                            {!record.accept && (
                                                <Button variant='contained' onClick={() => acceptRecord(studentIndex, recordIndex, student.roll)}>Accept</Button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2><b>Pending Cash Payments</b></h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Roll</th>
                        <th>Wing</th>
                        <th>Hall</th>
                        <th>Cash Requests</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {cashPayments.map((student, studentIndex) => (
                        <tr key={studentIndex}>
                            <td>{student.name}</td>
                            <td>{student.roll}</td>
                            <td>{student.wing}</td>
                            <td>{student.hall}</td>
                            <td>
                                <ul>
                                    {student.cashRequests.map((cashRequest, cashIndex) => (
                                        <li key={cashIndex}>
                                            Date: {(new Date(cashRequest.date)).toDateString()}<br />
                                            Due Amount: {cashRequest.dueAmountcash}<br />
                                            Accepted: {cashRequest.accept.toString()}<br />
                                            {!cashRequest.accept && (
                                                <Button variant='contained' onClick={() => acceptCashPayment(studentIndex, cashIndex, student.roll)}>Accept Cash Payment</Button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Collectcloths;

