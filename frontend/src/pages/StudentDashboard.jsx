import React from "react";
import Cookies from "js-cookie";
import CalendarTop2 from "../components/dashboardComponents/calendarTop2";
import StudentCalendar from "../components/dashboardComponents/studentcalender";
import { useNavigate } from 'react-router-dom';

function StudentDashboard(){
   const navigate = useNavigate();
   
   const infoCookie = Cookies.get('info');
   const user = infoCookie ? JSON.parse(decodeURIComponent(infoCookie)) : null;

    function onLogout() {
        Cookies.remove('info');
        const response = fetch('/session/logout', {
            method: "GET",
            credentials: "include",
        });
        navigate("/");
    }

    return(
        <>
        <div className="flex items-center justify-center flex-column p-10 max-w-xl mx-auto" style={{ backgroundImage: 'linear-gradient(to bottom, #b1dfdfef, hsl(0, 35%, 85%))' }}>
            <div className="form">
       <CalendarTop2 user={user} onLogout={onLogout}/>
       <StudentCalendar/>
       </div>
       </div>
       </>

    );
}

export default StudentDashboard;

