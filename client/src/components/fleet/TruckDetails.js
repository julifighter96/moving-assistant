import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  ListGroup,
  Table,
  Button,
  Badge
} from 'react-bootstrap';

const TruckDetails = () => {
  const { id } = useParams();
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingHistory, setBookingHistory] = useState([]);

  useEffect(() => {
    fetchTruckDetails();
  }, [id]);

  const fetchTruckDetails = async () => {
    try {
      const response = await fetch(`/moving-assistant/api/trucks/${id}`);
      const data = await response.json();
      setTruck(data);
      
      // Hier würde man normalerweise auch die Buchungshistorie laden
      // Beispieldaten für die Demo
      setBookingHistory([
        {
          id: 1,
          start_date: '2024-03-15',
          end_date: '2024-03-15',
          customer: 'Max Mustermann',
          address: 'Musterstraße 1, Berlin'
        },
        // ... weitere Buchungen
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching truck details:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Lade Fahrzeugdetails...</div>;
  }

  if (!truck) {
    return <div>Fahrzeug nicht gefunden</div>;
  }

  return (
    <div className="truck-details">
      <h2>Fahrzeugdetails</h2>
      
      <Card className="mb-4">
        <Card.Header>
          <h3>{truck.type} ({truck.license_plate})</h3>
          <Badge bg={
            truck.status === 'available' ? 'success' :
            truck.status === 'booked' ? 'warning' : 'danger'
          }>
            {truck.status === 'available' ? 'Verfügbar' :
             truck.status === 'booked' ? 'Gebucht' : 'In Wartung'}
          </Badge>
        </Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <strong>Ladekapazität:</strong> {truck.loading_capacity} kg
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Maße (L×B×H):</strong> {truck.length}×{truck.width}×{truck.height} cm
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Maximales Gewicht:</strong> {truck.max_weight} kg
            </ListGroup.Item>
          </ListGroup>
        </Card.Body>
      </Card>

      <h3>Buchungshistorie</h3>
      <Table striped bordered>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Kunde</th>
            <th>Adresse</th>
          </tr>
        </thead>
        <tbody>
          {bookingHistory.map(booking => (
            <tr key={booking.id}>
              <td>{booking.start_date}</td>
              <td>{booking.customer}</td>
              <td>{booking.address}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default TruckDetails; 