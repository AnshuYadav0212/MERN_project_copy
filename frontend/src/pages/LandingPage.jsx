// import "../styles/LandingPage.css";
// import { Link } from 'react-router-dom';


// function LandingPage() {
//     return (
//         <div className="flex items-center justify-center h-screen p-10 max-w-xl mx-auto animated fadeIn" style={{ backgroundImage: 'linear-gradient(to bottom, #b1dfdfef, hsl(0, 35%, 85%))' }}>
//             <div className="form pt-0">
//                 <img src={'DBMS_LOGO.png'} alt="Logo" className="logo animated bounceInDown" />
//                 <div className="text-center p-2 italic animated fadeInUp">
//                     "Say Goodbye to Laundry Hassles: Welcome to DBMS - Your Ultimate Laundry Solution at IITK!"
//                 </div>
//                 <div className="lower-part p-2 font-bold animated fadeIn">
//                     <p>Please select your role:</p>
//                     <div className="button-container p-1 animated fadeIn">
//                         <Link to="/login?type=student" className="animated fadeIn">
//                             <button className="button-Type1">Student</button>
//                         </Link>
//                     </div>
//                     <div className="button-container animated fadeIn">
//                         <Link to="/login?type=washerman" className="animated fadeIn">
//                             <button className="button-Type1">Washerman</button>
//                         </Link>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default LandingPage;
import React from "react";
import { Link } from 'react-router-dom';
import Layout from '../Gtranslator';  // Adjust the import path as necessary
import "../styles/LandingPage.css";

function LandingPage() {
  return (
    <Layout>
      <div className="flex items-center justify-center h-screen p-10 max-w-xl mx-auto animated fadeIn" style={{ backgroundImage: 'linear-gradient(to bottom, #b1dfdfef, hsl(0, 35%, 85%))' }}>
        <div className="form pt-0">
          <img src={'DBMS_LOGO.png'} alt="Logo" className="logo animated bounceInDown" />
          <div className="text-center p-2 italic animated fadeInUp">
            "Say Goodbye to Laundry Hassles: Welcome to DBMS - Your Ultimate Laundry Solution at IITK!"
          </div>
          <div className="lower-part p-2 font-bold animated fadeIn">
            <p>Please select your role:</p>
            <div className="button-container p-1 animated fadeIn">
              <Link to="/login?type=student" className="animated fadeIn">
                <button className="button-Type1">Student</button>
              </Link>
            </div>
            <div className="button-container animated fadeIn">
              <Link to="/login?type=washerman" className="animated fadeIn">
                <button className="button-Type1">Washerman</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default LandingPage;

