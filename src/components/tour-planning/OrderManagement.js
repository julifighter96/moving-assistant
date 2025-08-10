/**
 * Order Management - Auftragsverwaltung und Übersicht
 * Zeigt alle Aufträge mit Details, Status und Verwaltungsmöglichkeiten
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  MapPin, 
  Clock, 
  User,
  Phone,
  Mail,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  MoreHorizontal,
  Download,
  Plus,
  Target,
  DollarSign
} from 'lucide-react';
import { fetchDeals, REGIONS } from '../../services/pipedriveProjectService';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Lade echte Pipedrive-Daten mit exakter TourPlanner.js Methode
  useEffect(() => {
    fetchOrders();
  }, [selectedRegion]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('[OrderManagement] Starte Datenladung...');
      
      // Verwende die exakte TourPlanner.js Methode
      const data = await fetchDeals(selectedRegion);
      console.log(`[OrderManagement] ${data.length} Aufträge geladen:`, data);
      
      // Transformiere Pipedrive-Deals zu Orders (vereinfacht)
      const transformedOrders = data.map(deal => ({
        id: deal.id.toString(),
        title: deal.title || 'Unbenannter Auftrag',
        customer: {
          name: deal.organization || deal.person_name || 'Unbekannter Kunde',
          phone: deal.phone || 'N/A',
          email: deal.email || 'N/A'
        },
        pickup: {
          address: deal.originAddress || 'Adresse nicht verfügbar',
          date: deal.moveDate || new Date().toISOString().split('T')[0],
          time: '09:00',
          contact: deal.organization || deal.person_name || 'N/A',
          floor: deal.originFloor || 1,
          elevator: true
        },
        delivery: {
          address: deal.destinationAddress || 'Adresse nicht verfügbar',
          date: deal.moveDate || new Date().toISOString().split('T')[0],
          time: '14:00',
          contact: deal.organization || deal.person_name || 'N/A',
          floor: deal.destinationFloor || 1,
          elevator: true
        },
        status: deal.status === 'won' ? 'confirmed' : deal.status === 'open' ? 'pending' : 'completed',
        priority: deal.value > 5000 ? 'high' : deal.value > 2000 ? 'medium' : 'low',
        estimatedDuration: Math.max(120, Math.floor(deal.value / 100)), // Minuten
        items: deal.notes ? deal.notes.split(',').slice(0, 3) : ['Möbel', 'Kartons'],
        totalVolume: Math.max(10, Math.floor(deal.value / 200)), // m³
        price: deal.value || 0,
        assignedVehicle: deal.schlaileType ? 'Schlaile-Transport' : 'Standard-LKW',
        assignedDriver: 'Automatisch zugewiesen',
        notes: deal.notes || '',
        region: deal.region || 'Unbekannt',
        schlaileType: deal.schlaileType,
        createdAt: deal.add_time || new Date().toISOString(),
        updatedAt: deal.update_time || new Date().toISOString()
      }));

      setOrders(transformedOrders);
      setFilteredOrders(transformedOrders);
    } catch (error) {
      console.error('[OrderManagement] Fehler beim Laden der Aufträge:', error);
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Hilfsfunktionen wurden durch direkte Datenverarbeitung in fetchOrders ersetzt

  // Filter orders based on search and filters
  useEffect(() => {
    let filtered = orders;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.pickup.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.delivery.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(order => order.priority === priorityFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.pickup.date);
        switch (dateFilter) {
          case 'today':
            return orderDate.toDateString() === today.toDateString();
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return orderDate.toDateString() === tomorrow.toDateString();
          case 'week':
            const weekFromNow = new Date(today);
            weekFromNow.setDate(today.getDate() + 7);
            return orderDate >= today && orderDate <= weekFromNow;
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter, priorityFilter, dateFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'scheduled': return 'Geplant';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Storniert';
      default: return 'Unbekannt';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'in_progress': return <Truck className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Hoch';
      case 'medium': return 'Mittel';
      case 'low': return 'Niedrig';
      default: return 'Normal';
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const scheduled = orders.filter(o => o.status === 'scheduled').length;
    const inProgress = orders.filter(o => o.status === 'in_progress').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);

    return { total, pending, scheduled, inProgress, completed, totalRevenue };
  }, [orders]);

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Auftragsverwaltung</h3>
              <p className="text-sm text-gray-500">Übersicht und Verwaltung aller Umzugsaufträge</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Neuer Auftrag
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-6 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-600">Gesamt</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
              <div className="text-sm text-yellow-600">Ausstehend</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{stats.scheduled}</div>
              <div className="text-sm text-blue-600">Geplant</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{stats.inProgress}</div>
              <div className="text-sm text-green-600">Aktiv</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
              <div className="text-sm text-gray-600">Fertig</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{stats.totalRevenue.toLocaleString()}€</div>
              <div className="text-sm text-green-600">Umsatz</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Region Selector */}
            <div className="flex items-center">
              <label htmlFor="region-selector" className="text-sm font-medium text-gray-700 mr-2">
                Region:
              </label>
              <select
                id="region-selector"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {REGIONS.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Aufträge suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="scheduled">Geplant</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="completed">Abgeschlossen</option>
              <option value="cancelled">Storniert</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Alle Prioritäten</option>
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Niedrig</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Alle Termine</option>
              <option value="today">Heute</option>
              <option value="tomorrow">Morgen</option>
              <option value="week">Diese Woche</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Lade Aufträge...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Aufträge gefunden</h3>
                <p className="text-gray-500">Passen Sie Ihre Filter an oder erstellen Sie einen neuen Auftrag</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowDetails(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{order.title}</h4>
                        <p className="text-sm text-gray-500">Auftrag {order.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                        {getPriorityText(order.priority)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusText(order.status)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-3">
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="font-medium">Abholung:</span>
                      </div>
                      <p className="text-sm text-gray-900 ml-6">{order.pickup.address}</p>
                      <p className="text-sm text-gray-500 ml-6">
                        {new Date(order.pickup.date).toLocaleDateString('de-DE')} um {order.pickup.time}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Target className="w-4 h-4 mr-2" />
                        <span className="font-medium">Lieferung:</span>
                      </div>
                      <p className="text-sm text-gray-900 ml-6">{order.delivery.address}</p>
                      <p className="text-sm text-gray-500 ml-6">
                        {new Date(order.delivery.date).toLocaleDateString('de-DE')} um {order.delivery.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{order.customer.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{order.estimatedDuration}h</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span>{order.price}€</span>
                      </div>
                      {order.assignedDriver && (
                        <div className="flex items-center">
                          <Truck className="w-4 h-4 mr-1" />
                          <span>{order.assignedDriver}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setShowDetails(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Sidebar */}
      {showDetails && selectedOrder && (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Auftragsdetails</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Order Info */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{selectedOrder.title}</h4>
              <p className="text-sm text-gray-500 mb-3">Auftrag {selectedOrder.id}</p>
              
              <div className="flex items-center space-x-2 mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1">{getStatusText(selectedOrder.status)}</span>
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedOrder.priority)}`}>
                  {getPriorityText(selectedOrder.priority)}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Kunde</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{selectedOrder.customer.name}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{selectedOrder.customer.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{selectedOrder.customer.email}</span>
                </div>
              </div>
            </div>

            {/* Pickup & Delivery */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Abholung & Lieferung</h5>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="font-medium text-blue-900">Abholung</span>
                  </div>
                  <p className="text-sm text-blue-800 mb-1">{selectedOrder.pickup.address}</p>
                  <p className="text-sm text-blue-600">
                    {new Date(selectedOrder.pickup.date).toLocaleDateString('de-DE')} um {selectedOrder.pickup.time}
                  </p>
                  <p className="text-sm text-blue-600">
                    {selectedOrder.pickup.floor}. Etage, {selectedOrder.pickup.elevator ? 'Aufzug vorhanden' : 'Kein Aufzug'}
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Target className="w-4 h-4 mr-2 text-green-600" />
                    <span className="font-medium text-green-900">Lieferung</span>
                  </div>
                  <p className="text-sm text-green-800 mb-1">{selectedOrder.delivery.address}</p>
                  <p className="text-sm text-green-600">
                    {new Date(selectedOrder.delivery.date).toLocaleDateString('de-DE')} um {selectedOrder.delivery.time}
                  </p>
                  <p className="text-sm text-green-600">
                    {selectedOrder.delivery.floor}. Etage, {selectedOrder.delivery.elevator ? 'Aufzug vorhanden' : 'Kein Aufzug'}
                  </p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Gegenstände</h5>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity}x - {item.volume}m³</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">Gesamtvolumen:</span>
                  <span className="text-gray-900">{selectedOrder.totalVolume}m³</span>
                </div>
              </div>
            </div>

            {/* Assignment */}
            {selectedOrder.assignedVehicle && (
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Zuteilung</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Truck className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{selectedOrder.assignedVehicle}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{selectedOrder.assignedDriver}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedOrder.notes && (
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Notizen</h5>
                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            {/* Financial */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Finanzen</h5>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-900">Auftragswert:</span>
                  <span className="text-xl font-bold text-green-900">{selectedOrder.price}€</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Geschätzte Dauer: {selectedOrder.estimatedDuration} Stunden
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
