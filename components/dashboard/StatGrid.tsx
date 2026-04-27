
import React from 'react';
import { StatCard } from './StatCard';
import {
    DollarSign,
    Users,
    Calendar as CalendarIcon,
    Activity
} from 'lucide-react';
import { Appointment, Client, Service } from '../../types';

interface StatGridProps {
    appointments: Appointment[];
    clients: Client[];
    services: Service[];
    sales?: any[];
}

export const StatGrid: React.FC<StatGridProps> = ({ appointments, clients, services, sales = [] }) => {
    const today = new Date().toLocaleDateString();

    const todayAppointments = appointments.filter(a =>
        new Date(a.startDateTime).toLocaleDateString() === today
    );

    const activeClients = clients.length;

    // Calculate actual revenue from real sales
    const revenue = sales.reduce((acc, sale) => acc + (Number(sale.total) || 0), 0);

    // Calculate today's sales
    const todayRevenue = sales
        .filter(s => new Date(s.createdAt).toLocaleDateString() === today)
        .reduce((acc, s) => acc + (Number(s.total) || 0), 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <StatCard
                title="Ventas Hoy"
                value={`$${todayRevenue.toLocaleString()}`}
                icon={DollarSign}
                trend={`Total: $${revenue.toLocaleString()}`}
                trendPositive={true}
            />
            <StatCard
                title="Clientes Activos"
                value={activeClients}
                icon={Users}
                trend="+5 nuevos"
                trendPositive={true}
                color="#10B981"
            />
            <StatCard
                title="Citas para Hoy"
                value={todayAppointments.length}
                icon={CalendarIcon}
                trend="82% ocupación"
                trendPositive={true}
                color="#3B82F6"
            />
            <StatCard
                title="Uptime de Red"
                value="99.9%"
                icon={Activity}
                trend="Lat: 24ms"
                trendPositive={true}
                color="#8B5CF6"
            />
        </div>
    );
};
