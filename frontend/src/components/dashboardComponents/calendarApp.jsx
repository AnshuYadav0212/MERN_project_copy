import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Cookies from "js-cookie";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import Notification from "./notification";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./calendarApp.css";

const CalendarApp = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventName, setEventName] = useState("visiting");
  const [events, setEvents] = useState([]);

  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const Date_Click_Fun = (date) => {
    setSelectedDate(date);
    if (!eventName) {
      setEventName("visiting");
    }
  };

  const Create_Event_Fun = () => {
    if (selectedDate && eventName) {
      const newEvent = {
        id: new Date().getTime(),
        date: selectedDate,
        title: eventName,
      };
      setEvents([...events, newEvent]);
    }
  };

  const Delete_Event_Fun = (eventId) => {
    const updatedEvents = events.filter((event) => event.id !== eventId);
    setEvents(updatedEvents);
  };

  const selectedHall = Cookies.get("selectedHall");
  const selectedWing = Cookies.get("selectedWing");

  const addEvents = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/washerman/wing/addEvents`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          events,
          hall: selectedHall,
          wing: selectedWing,
        }),
      });

      if (response.ok) {
        // alert('')
        toast.success("Events added  successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
        console.log("Events successfully sent to backend.");
        console.log(response);
        
        // Optionally, you can clear the events state after successfully sending them to the backend
        setEvents([]);
      } else {
        console.error("Failed to send events to backend.");
      }
    } catch (error) {
      console.error("Error sending events to backend:", error);
    }
  };
  const updateUpcomingDate = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/washerman/upcomingDate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ upcomingDate: selectedDate.toDateString() }),
      });

      const data = await response.json();

      if (response.ok) {
        // alert('')
        toast.success("Upcoming date updated successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
        
      } else {
        console.error(data.message); // Error message
      }
    } catch (error) {
      console.error('Error updating upcoming date:', error);
    }
  };

  return (
    <>
    <ToastContainer/>
      <div className="">
        <div className="container">
          <div className="calendar-container">
            <Calendar
              className="calender"
              value={selectedDate}
              onClickDay={Date_Click_Fun}
              tileClassName={({ date }) =>
                selectedDate &&
                date.toDateString() === selectedDate.toDateString()
                  ? "selected"
                  : events.some(
                      (event) => event.date.toDateString() === date.toDateString()
                    )
                  ? "event-marked"
                  : ""
              }
              minDate={minDate} // Setting the minimum date
            />
          </div>
          <div className="event-container">
          <div className="event-form">
            <h3>Add Upcoming Date</h3>
            <p>
              Selected Date:
              {selectedDate ? selectedDate.toDateString() : <b>Select a date </b>}
            </p>
           
            <Button variant="contained" className="create-btn" onClick={updateUpcomingDate} id="11">
              Notify Upcoming Date
            </Button>
          </div>
            <div className="event-form">
              <h3>Create Event</h3>
              <p>
                Selected Date:
                {selectedDate ? (
                  selectedDate.toDateString()
                ) : (
                  <b>Select a date </b>
                )}
              </p>
              <input
                type="text"
                placeholder="Event Name"
                value={eventName}
                className="pb-2"
                id="input" // Adding id here
                onChange={(e) => setEventName(e.target.value)}
              />
              <Button
                variant="contained"
                className="create-btn"
                onClick={Create_Event_Fun}
                id="11"
              >
                Add Event
              </Button>
            </div>
            <div className="event-list">
              <h3>Events</h3>
              <ul>
                {events.map((event) => (
                  <li key={event.id}>
                    <span>
                      {event.date.toDateString()} - {event.title}
                    </span>
                    <Button
                      variant="outlined"
                      style={{ color: "red", border: "1px solid red" }}
                      startIcon={<DeleteIcon />}
                      onClick={() => Delete_Event_Fun(event.id)}
                      id="11"
                    >
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Notification Notify={addEvents} />
    </>
  );
};

export default CalendarApp;
