import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  InputGroup,
  Row,
  Col
} from 'react-bootstrap';

const FleetOverview = () => {
  const [trucks, setTrucks] = useState([]);
  const [filteredTrucks, setFilteredTrucks] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    minCapacity: ''
  });

  useEffect(() => {
    fetchTrucks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trucks, filters]);

  const fetchTrucks = async () => {
    try {
      const response = await fetch('/moving-assistant/api/trucks');
      const data = await response.json();
      setTrucks(data);
      setFilteredTrucks(data);
    } catch (error) {
      console.error('Error fetching trucks:', error);
    }
  };

  const applyFilters = () => {
    let filtered = trucks;

    if (filters.type) {
      filtered = filtered.filter(truck => 
        truck.type.toLowerCase().includes(filters.type.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(truck => 
        truck.status === filters.status
      );
    }

    if (filters.minCapacity) {
      filtered = filtered.filter(truck => 
        truck.loading_capacity >= parseInt(filters.minCapacity)
      );
    }

    setFilteredTrucks(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fleet-overview">
      <h2>Fuhrpark Übersicht</h2>
      
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Fahrzeugtyp</Form.Label>
            <Form.Control
              type="text"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              placeholder="z.B. Koffer"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Status</Form.Label>
            <Form.Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">Alle</option>
              <option value="available">Verfügbar</option>
              <option value="booked">Gebucht</option>
              <option value="maintenance">In Wartung</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Min. Kapazität (kg)</Form.Label>
            <Form.Control
              type="number"
              name="minCapacity"
              value={filters.minCapacity}
              onChange={handleFilterChange}
              placeholder="z.B. 3500"
            />
          </Form.Group>
        </Col>
      </Row>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Kennzeichen</th>
            <th>Typ</th>
            <th>Kapazität</th>
            <th>Maße (L×B×H)</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredTrucks.map(truck => (
            <tr key={truck.id}>
              <td>{truck.license_plate}</td>
              <td>{truck.type}</td>
              <td>{truck.loading_capacity} kg</td>
              <td>
                {truck.length}×{truck.width}×{truck.height} cm
              </td>
              <td>
                <span className={`status-badge status-${truck.status}`}>
                  {truck.status === 'available' ? 'Verfügbar' :
                   truck.status === 'booked' ? 'Gebucht' : 'In Wartung'}
                </span>
              </td>
              <td>
                <Button 
                  variant="info" 
                  size="sm"
                  onClick={() => window.location.href = `/fleet/${truck.id}`}
                >
                  Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default FleetOverview; 