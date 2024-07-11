import React, { useState, useEffect } from 'react';
import '../styles/SummaryPage.css';
import Cookies from 'js-cookie';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL=process.env.REACT_APP_BACKEND_URL||'http://localhost:8080';

const SummaryPage = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const hall = Cookies.get('selectedHall');
  const wing = Cookies.get('selectedWing');
  const navigate = useNavigate();

  const backButton = () => {
    navigate("/WashermanDashboard");
  };

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/washerman/wing/fetchSummary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ hall, wing }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch summary data');
        }

        const data = await response.json();
        setSummaryData(data.summary);
        setLoading(false);
      } catch (error) {
        setError('Error fetching summary data');
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [hall, wing]);

  const handleGetPdf = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/washerman/wing/printSummary`, { hall, wing }, { responseType: 'blob' });

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);

      // Open the PDF in a new window
      window.open(pdfUrl);

      // Optionally, if you want to provide a download link:
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.setAttribute('download', 'summary.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error fetching PDF:', error);
    }
  };

  if (loading) {
    return <div className="cloth-collection loading">Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={backButton}>
        Back
      </Button>
      <h1><strong>Summary Page</strong></h1>
      <div className="summary-table-container">
        <table className="summary-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Wing</th>
              <th>Hall</th>
              <th>Total Clothes</th>
              <th>Total Dues</th>
              <th>Month</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((item, index) => (
              <tr key={index}>
                <td>{item.Name}</td>
                <td>{item.Wing}</td>
                <td>{item.Hall}</td>
                <td>{item["Total Clothes"]}</td>
                <td>{item["Total Dues"]}</td>
                <td>{item.Month}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="contained" onClick={handleGetPdf}>
        Print Summary
      </Button>
    </div>
  );
};

export default SummaryPage;
