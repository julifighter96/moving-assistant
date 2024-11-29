const ItemForm = ({ item, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      name: item?.name || '',
      volume: item?.volume || 0,
      width: item?.width || 0,
      length: item?.length || 0,
      height: item?.height || 0
    });
  
    const handleChange = (field, value) => {
      const numValue = field !== 'name' ? parseFloat(value) || 0 : value;
      setFormData(prev => {
        const newData = { ...prev, [field]: numValue };
        // Auto-calculate volume if dimensions are set
        if (['width', 'length', 'height'].includes(field)) {
          newData.volume = newData.width * newData.length * newData.height;
        }
        return newData;
      });
    };
  
    return (
      <div className="space-y-4">
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Name des Gegenstands"
          className="w-full p-2 border rounded"
        />
        <div className="grid grid-cols-4 gap-2">
          <input
            type="number"
            value={formData.width}
            onChange={(e) => handleChange('width', e.target.value)}
            placeholder="Breite (m)"
            className="p-2 border rounded"
          />
          <input
            type="number"
            value={formData.length}
            onChange={(e) => handleChange('length', e.target.value)}
            placeholder="Länge (m)"
            className="p-2 border rounded"
          />
          <input
            type="number"
            value={formData.height}
            onChange={(e) => handleChange('height', e.target.value)}
            placeholder="Höhe (m)"
            className="p-2 border rounded"
          />
          <input
            type="number"
            value={formData.volume}
            onChange={(e) => handleChange('volume', e.target.value)}
            placeholder="Volumen (m³)"
            className="p-2 border rounded"
            readOnly
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-100 rounded">
            Abbrechen
          </button>
          <button 
            onClick={() => onSubmit(formData)} 
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Speichern
          </button>
        </div>
      </div>
    );
  };