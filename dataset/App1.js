import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { Card, CardContent, Typography, IconButton, CardActions } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const globeEl = useRef();
  const [airports, setAirports] = useState([]);
  const [filteredAirports, setFilteredAirports] = useState([]);
  const [flightPaths, setFlightPaths] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const resetToInitialState = () => {
    setSearchTerm('');
    setShowDropdown(false);
    setSelectedFlight(null);
    setFilteredAirports(airports); // Resetting to show all airports
    setFlightPaths([]); // Clearing all flight paths
  };


  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        resetToInitialState();
      }
    };
  
    // Add event listener to the document
    document.addEventListener('keydown', handleKeyDown);
  
    // Cleanup the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [airports]);



  useEffect(() => {
    fetch('http://127.0.0.1:5000/airports')
      .then(response => response.json())
      .then(data => {
        setAirports(data);
        setFilteredAirports(data); // Initially, no filter applied
      })
      .catch(error => console.error('Error fetching airport data:', error));
  }, []);


  
  useEffect(() => {
    const results = searchTerm ? airports.filter(airport =>
      airport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airport.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airport.city.toLowerCase().includes(searchTerm.toLowerCase())
    ) : airports;
    setFilteredAirports(results);
    setShowDropdown(searchTerm !== '' && results.length > 0);
  }, [searchTerm, airports]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectAirport = (airport) => {
    setSearchTerm(airport.name);  // Optionally update the search term to the selected airport's name
    setShowDropdown(false);
    globeEl.current.pointOfView({ lat: airport.lat, lng: airport.lng, altitude: 2 }, 1000);  // Focus the globe on the airport
  };

  const handleAirportClick = (airport) => {
    setSelectedAirport(airport);
    fetch(`http://localhost:5000/flight-data?airportId=${airport.index}`)
      .then(response => response.json())
      .then(data => {
        setFlightPaths(data);
      })
      .catch(error => console.error('Error fetching flight paths:', error));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', position: 'relative' }}>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search for airports..."
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '10px',
          width: '200px',
          zIndex: 1000
        }}
      />
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '50px',
          left: '20px',
          width: '200px',
          border: '1px solid #ccc',
          backgroundColor: '#fff',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1001
        }}>
          {filteredAirports.map((airport, index) => (
            <div
              key={index}
              onClick={() => handleSelectAirport(airport)}
              style={{
                padding: '10px',
                cursor: 'pointer',
                borderBottom: (index === filteredAirports.length - 1) ? 'none' : '1px solid #eee'
              }}
            >
              {airport.name} [{airport.code}]
            </div>
          ))}
        </div>
      )}
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="rgba(0,0,0,0)"
        pointsData={filteredAirports}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => 'gold'}
        pointAltitude={0}
        pointRadius={0.2}
        onPointClick={handleAirportClick}
        arcsData={flightPaths}
        arcColor="color"
        arcAltitudeAutoScale={0.5}
        arcStroke={0.2}
        arcDashLength={1}
        arcDashGap={0}
        arcDashAnimateTime={500}
        arcsTransitionDuration={0}
        onArcClick={(arcData) => setSelectedFlight(arcData)}
        arcLabel={(d) => `
          <div style="text-align: left;">
            <strong>${d.acode}: ${d.scode} --> ${d.dcode}
          </div>
        `}
        pointLabel={(point) => {
          return `<div style="padding: 5px; background: rgba(0,0,0,0.7); color: #fff;">
                    <strong>${point.name} [</strong>${point.code}] [</strong>${point.city}]
                  </div>`;
        }}
      />
      <AnimatePresence>
        {selectedFlight && (
          <motion.div
              key={selectedFlight.index}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: 'spring', stiffness: 100 }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '300'
              }}
        >
        <Card sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: 300,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 2,
        boxShadow: 3
      }}>
        <CardContent>
          <IconButton
            aria-label="close"
            onClick={() => setSelectedFlight(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h5" component="div">
            Flight Details
          </Typography>
          <Typography color="text.secondary">
            Airline: {selectedFlight.airline}
          </Typography>
          <Typography color="text.secondary">
            Aircraft: {selectedFlight.airplane}
          </Typography>
          <Typography color="text.secondary">
            {selectedFlight.scity} [{selectedFlight.scode}] -- ✈️ -- {selectedFlight.dcity} [{selectedFlight.dcode}]
          </Typography>
        </CardContent>
      </Card>
      </motion.div>
    )}
  </AnimatePresence>
  </div>
  );
}

export default App;