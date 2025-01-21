import React from 'react';
import { useDrag } from 'react-dnd';

const EmployeeCard = ({ employee }) => {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('employee', JSON.stringify(employee));
      }}
      className="p-3 bg-white border rounded shadow-sm hover:shadow cursor-move"
    >
      <div className="font-medium">
        {employee.first_name} {employee.last_name}
      </div>
      <div className="text-sm text-gray-500">
        {employee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
      </div>
    </div>
  );
};

export default EmployeeCard; 