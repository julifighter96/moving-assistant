const API_BASE_URL = '/moving-assistant/api';

export const fetchVehicles = async () => {
  const response = await fetch(`${API_BASE_URL}/vehicles`);
  if (!response.ok) {
    throw new Error('Failed to fetch vehicles');
  }
  return response.json();
};

export const fetchVehicle = async (id) => {
  const response = await fetch(`${API_BASE_URL}/vehicles/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vehicle');
  }
  return response.json();
};

export const checkVehicleAvailability = async (params) => {
  const response = await fetch(`${API_BASE_URL}/vehicles/check-availability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error('Failed to check vehicle availability');
  }
  return response.json();
};

export const bookVehicle = async (vehicleId, bookingData) => {
  const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });
  if (!response.ok) {
    throw new Error('Failed to book vehicle');
  }
  return response.json();
};

export const updateVehicleStatus = async (vehicleId, status) => {
  const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update vehicle status');
  }
  return response.json();
};

export const fetchVehicleBookings = async (vehicleId) => {
  const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/bookings`);
  if (!response.ok) {
    throw new Error('Failed to fetch vehicle bookings');
  }
  return response.json();
}; 