import CalendarApp from "../components/dashboardComponents/calendarApp";
import CalendarTop from "../components/dashboardComponents/calendarTop";
import Notification from "../components/dashboardComponents/notification";
import Footer from "../components/dashboardComponents/footerwashdash";

import { useNavigate } from "react-router-dom";

import Cookies from "js-cookie";

function WashermanDashboard(){
    const navigate = useNavigate();
    const infoCookie = Cookies.get('info');
    const user = infoCookie ? JSON.parse(decodeURIComponent(infoCookie)) : null;

    function onLogout() {
        Cookies.remove('info');
        Cookies.remove('selectedHall');
        Cookies.remove('selectedWing');
        const response = fetch(`${process.env.REACT_APP_BACKEND_URL}/session/washerman/logout`, {
            method: "GET",
            credentials: "include",
        });
        navigate("/");
    }
    const selectedHall=Cookies.get('selectedHall');
    const selectedWing =Cookies.get('selectedWing');
    function collect(){
        navigate("/Washerman/Collect")
    }
    function print(){
        navigate("/Washerman/PrintSummary")
    }

    return (
        <>
            <div className="flex items-center justify-center flex-column p-10 max-w-xl mx-auto"style={{ backgroundImage: 'linear-gradient(to bottom, #b1dfdfef, hsl(0, 35%, 85%))' }}>
                <div className="form">
                    {/* Pass selected hall and wing to CalendarTop component */}
                    <CalendarTop user={user} onLogout={onLogout} hall={selectedHall} wing={selectedWing} />
                    <CalendarApp />
                    <Footer collect={collect} print={print}/>
                </div>
            </div>
        </>
    );
}

export default WashermanDashboard;
