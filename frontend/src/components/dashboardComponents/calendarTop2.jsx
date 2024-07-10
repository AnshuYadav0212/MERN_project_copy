import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import "./calendarTop.css";
import Cookies from "js-cookie";

const CalendarTop2 = ({ user, onLogout }) => {
  const [upcomingDate, setUpcomingDate] = useState(null);
  const [washermanName, setWashermanName] = useState(null);
  const [washermanContact, setWashermanContact] = useState(null);

  const selectedHall = Cookies.get("selectedHall");
  const selectedWing = Cookies.get("selectedWing");
  const options = { timeZone: 'Asia/Kolkata' };

  useEffect(() => {
    const fetchUpcomingDate = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/student/fetchUpcomingDate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            hall: selectedHall,
            wing: selectedWing,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to fetch upcoming date');
        }
        const data = await response.json();
        console.log('Fetched Data:', data); // Log the fetched data
        if (data.success) {
          setUpcomingDate(data.upcomingDate);
          setWashermanName(data.washermanName);
          setWashermanContact(data.washermanContact);
        } else {
          console.error('Error fetching upcoming date:', data.message);
        }
      } catch (error) {
        console.error('Error fetching upcoming date:', error);
      }
    };

    fetchUpcomingDate();
  }, []);

  useEffect(() => {
    console.log('Washerman Name:', washermanName);
    console.log('Washerman Contact:', washermanContact);
  }, [washermanName, washermanContact]);

  return (
    <div className='top'>
      {/* Display upcoming date if available */}
      {upcomingDate && (
        <div className="upcoming-date">
          <div className="washerman-info">
            <div className="info-row">
              <span className="info-label">Washerman Upcoming Date:</span>
              <span className="info-value" style={{ color: 'red' }}>{(new Date(upcomingDate)).toLocaleDateString('en-IN', options)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Washerman Name:</span>
              <span className="info-value" style={{ color: 'blue' }}>{washermanName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Contact:</span>
              <span className="info-value" style={{ color: 'green' }}>{washermanContact}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-row">
        <div className="user-profile-container">
          <div className="profile-pic">
          <img
              src={`https://oa.cc.iitk.ac.in/Oa/Jsp/Photo/${user?.roll}_0.jpg`}
              alt={`${user?.name}'s profile`}
              onError={(e) => { e.target.onerror = null; e.target.src = 'profile.jpeg'; }}
            />
          </div>
          <div className="pl-2">
            <p><strong>Name:</strong> {user?.name} </p>
            {user?.email && <p><strong>Email:</strong> {user?.email}</p>}
            {user?.contact && <p><strong>Mobile No:</strong> {user?.contact}</p>}
            <p><strong>Hall:</strong> {user?.hall}</p>
            <p><strong>Wing:</strong> {user?.wing}</p>
            <Button variant="contained" onClick={onLogout}>Logout</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTop2;
